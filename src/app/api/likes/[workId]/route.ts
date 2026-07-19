import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendNotification, reactionLabel } from "@/lib/notifications";

/** notifications.ts の REACTION_LABELS と対応。増やすときは両方直す */
const VALID_REACTIONS = ["like", "laugh", "cry", "empathy", "amazing"];

async function getReactionCounts(workId: string) {
  const groups = await prisma.like.groupBy({
    by: ["reaction"],
    where: { workId },
    _count: true,
  });
  const counts: Record<string, number> = {};
  for (const g of groups) {
    counts[g.reaction] = g._count;
  }
  return counts;
}

export async function POST(request: NextRequest, props: { params: Promise<{ workId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { success } = await rateLimit(`likes:${session.user.id}`, { limit: 120, windowMs: 60 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: "リアクション制限に達しました" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    // 未知の値をそのまま保存すると集計(groupBy)に未定義キーが混ざり、
    // スタンプの表示が壊れる。数値等が来るとPrismaが例外を投げる
    const reaction = VALID_REACTIONS.includes(body.reaction) ? body.reaction : "like";

    const existing = await prisma.like.findUnique({
      where: {
        userId_workId: {
          userId: session.user.id,
          workId: params.workId,
        },
      },
    });

    if (existing) {
      if (existing.reaction === reaction) {
        // 同じリアクション → トグルOFF（削除）。削除とカウンター減算を原子的に
        const [, work] = await prisma.$transaction([
          prisma.like.delete({ where: { id: existing.id } }),
          prisma.work.update({
            where: { id: params.workId },
            data: { likeCount: { decrement: 1 } },
            select: { likeCount: true },
          }),
        ]);
        const reactionCounts = await getReactionCounts(params.workId);
        return NextResponse.json({
          likeCount: Math.max(0, work.likeCount),
          reactionCounts,
          userReaction: null,
        });
      } else {
        // 別のリアクション → 変更
        await prisma.like.update({
          where: { id: existing.id },
          data: { reaction },
        });
        const work = await prisma.work.findUnique({
          where: { id: params.workId },
          select: { likeCount: true },
        });
        const reactionCounts = await getReactionCounts(params.workId);
        return NextResponse.json({
          likeCount: work!.likeCount,
          reactionCounts,
          userReaction: reaction,
        });
      }
    }

    // 新規リアクション。作成とカウンター増加を原子的に
    const [, work] = await prisma.$transaction([
      prisma.like.create({
        data: {
          userId: session.user.id,
          workId: params.workId,
          reaction,
        },
      }),
      prisma.work.update({
        where: { id: params.workId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true, authorId: true, title: true },
      }),
    ]);

    const reactionCounts = await getReactionCounts(params.workId);

    // 通知（自分の作品でなければ）
    if (work.authorId !== session.user.id) {
      sendNotification({
        userId: work.authorId,
        type: "like",
        title: `${reactionLabel(reaction)}されました`,
        body: `${session.user.name || "ユーザー"}さんが「${work.title}」に${reactionLabel(reaction)}しました`,
        link: `/work/${params.workId}`,
      }).catch(() => {});
    }

    return NextResponse.json({
      likeCount: work.likeCount,
      reactionCounts,
      userReaction: reaction,
    });
  } catch (error) {
    console.error("POST /api/likes error:", error);
    return NextResponse.json(
      { error: "リアクションに失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ workId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 冪等: 実際に削除された時のみカウンター減算（二重解除でも壊れない）
    const likeCount = await prisma.$transaction(async (tx) => {
      const del = await tx.like.deleteMany({
        where: { userId: session.user.id, workId: params.workId },
      });
      if (del.count === 0) {
        const w = await tx.work.findUnique({
          where: { id: params.workId },
          select: { likeCount: true },
        });
        return w?.likeCount ?? 0;
      }
      const w = await tx.work.update({
        where: { id: params.workId },
        data: { likeCount: { decrement: del.count } },
        select: { likeCount: true },
      });
      return w.likeCount;
    });

    const reactionCounts = await getReactionCounts(params.workId);

    return NextResponse.json({
      likeCount: Math.max(0, likeCount),
      reactionCounts,
      userReaction: null,
    });
  } catch (error) {
    console.error("DELETE /api/likes error:", error);
    return NextResponse.json(
      { error: "リアクション取り消しに失敗しました" },
      { status: 500 }
    );
  }
}
