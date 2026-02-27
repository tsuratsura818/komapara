import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { workId: string } }
) {
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

export async function POST(
  request: NextRequest,
  { params }: { params: { workId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
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

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json(
      { error: "コメントの投稿に失敗しました" },
      { status: 500 }
    );
  }
}
