import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendNotification, reactionLabel } from "@/lib/notifications";

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

export async function POST(
  request: NextRequest,
  { params }: { params: { workId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { success } = rateLimit(`likes:${session.user.id}`, { limit: 120, windowMs: 60 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: "リアクション制限に達しました" }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const reaction = body.reaction || "like";

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
        // 同じリアクション → トグルOFF（削除）
        await prisma.like.delete({ where: { id: existing.id } });
        const work = await prisma.work.update({
          where: { id: params.workId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });
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

    // 新規リアクション
    await prisma.like.create({
      data: {
        userId: session.user.id,
        workId: params.workId,
        reaction,
      },
    });

    const work = await prisma.work.update({
      where: { id: params.workId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true, authorId: true, title: true },
    });

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { workId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    await prisma.like.delete({
      where: {
        userId_workId: {
          userId: session.user.id,
          workId: params.workId,
        },
      },
    });

    const work = await prisma.work.update({
      where: { id: params.workId },
      data: { likeCount: { decrement: 1 } },
      select: { likeCount: true },
    });

    const reactionCounts = await getReactionCounts(params.workId);

    return NextResponse.json({
      likeCount: Math.max(0, work.likeCount),
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
