import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { workId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const existing = await prisma.like.findUnique({
      where: {
        userId_workId: {
          userId: session.user.id,
          workId: params.workId,
        },
      },
    });

    if (existing) {
      const work = await prisma.work.findUnique({
        where: { id: params.workId },
        select: { likeCount: true },
      });
      return NextResponse.json({ likeCount: work?.likeCount || 0 });
    }

    await prisma.like.create({
      data: {
        userId: session.user.id,
        workId: params.workId,
      },
    });

    const work = await prisma.work.update({
      where: { id: params.workId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });

    return NextResponse.json({ likeCount: work.likeCount });
  } catch (error) {
    console.error("POST /api/likes error:", error);
    return NextResponse.json(
      { error: "いいねに失敗しました" },
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

    return NextResponse.json({ likeCount: Math.max(0, work.likeCount) });
  } catch (error) {
    console.error("DELETE /api/likes error:", error);
    return NextResponse.json(
      { error: "いいね取り消しに失敗しました" },
      { status: 500 }
    );
  }
}
