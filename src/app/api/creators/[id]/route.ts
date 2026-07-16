import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        works: {
          where: { isPublished: true },
          include: {
            tags: { select: { name: true, slug: true, emoji: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            followers: true,
            works: { where: { isPublished: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "作家が見つかりません" },
        { status: 404 }
      );
    }

    let isFollowing = false;
    if (session?.user?.id && session.user.id !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.bio,
      xHandle: user.xHandle,
      followerCount: user._count.followers,
      workCount: user._count.works,
      isFollowing,
      works: user.works,
    });
  } catch (error) {
    console.error("GET /api/creators/[id] error:", error);
    return NextResponse.json(
      { error: "作家情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
