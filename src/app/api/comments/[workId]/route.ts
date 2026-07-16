import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";
import { sendNotification } from "@/lib/notifications";

export async function GET(request: NextRequest, props: { params: Promise<{ workId: string }> }) {
  const params = await props.params;
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 50);
    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: { workId: params.workId },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.comment.count({ where: { workId: params.workId } }),
    ]);

    return NextResponse.json({ comments, totalCount });
  } catch (error) {
    console.error("GET /api/comments error:", error);
    return NextResponse.json(
      { error: "コメントの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ workId: string }> }) {
  const params = await props.params;
  try {
    const { error, session } = await requireUser();
    if (error) return error;

    const { success } = await rateLimit(`comments:post:${session.user.id}`, {
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "コメント制限に達しました。しばらくしてからお試しください" },
        { status: 429 }
      );
    }

    const { body } = await request.json();

    if (!body || body.length === 0 || body.length > 500) {
      return NextResponse.json(
        { error: "コメントは1〜500文字で入力してください" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        body,
        userId: session.user.id,
        workId: params.workId,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // 通知（自分の作品でなければ）
    const work = await prisma.work.findUnique({
      where: { id: params.workId },
      select: { authorId: true, title: true },
    });
    if (work && work.authorId !== session.user.id) {
      sendNotification({
        userId: work.authorId,
        type: "comment",
        title: "コメントが届きました",
        body: `${session.user.name || "ユーザー"}さんが「${work.title}」にコメントしました: ${body.slice(0, 50)}`,
        link: `/work/${params.workId}`,
      }).catch(() => {});
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { error: "コメントの投稿に失敗しました" },
      { status: 500 }
    );
  }
}
