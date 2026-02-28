import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { success } = rateLimit(`follows:${session.user.id}`, { limit: 60, windowMs: 60 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: "フォロー制限に達しました" }, { status: 429 });
    }

    if (session.user.id === params.userId) {
      return NextResponse.json(
        { error: "自分自身をフォローできません" },
        { status: 400 }
      );
    }

    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: params.userId,
        },
      },
      update: {},
      create: {
        followerId: session.user.id,
        followingId: params.userId,
      },
    });

    // 通知
    sendNotification({
      userId: params.userId,
      type: "follow",
      title: "新しいフォロワー",
      body: `${session.user.name || "ユーザー"}さんにフォローされました`,
      link: `/creator/${session.user.id}`,
    }).catch(() => {});

    return new NextResponse(null, { status: 201 });
  } catch (error) {
    console.error("POST /api/follows error:", error);
    return NextResponse.json(
      { error: "フォローに失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: params.userId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/follows error:", error);
    return NextResponse.json(
      { error: "フォロー解除に失敗しました" },
      { status: 500 }
    );
  }
}
