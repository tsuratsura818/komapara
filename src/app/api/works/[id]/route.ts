import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const { id } = params;

    const work = await prisma.work.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            xHandle: true,
          },
        },
        tags: { select: { name: true, slug: true, emoji: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        _count: { select: { comments: true } },
        ...(session?.user?.id
          ? {
              likes: {
                where: { userId: session.user.id },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    // フォロー状態チェック
    let isFollowingAuthor = false;
    if (session?.user?.id && session.user.id !== work.authorId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: work.authorId,
          },
        },
      });
      isFollowingAuthor = !!follow;
    }

    return NextResponse.json({
      id: work.id,
      title: work.title,
      description: work.description,
      panels: work.panels,
      author: work.author,
      genres: work.tags,
      likeCount: work.likeCount,
      viewCount: work.viewCount,
      commentCount: work._count.comments,
      xPostUrl: work.xPostUrl,
      createdAt: work.createdAt,
      isLiked: "likes" in work ? (work.likes as unknown[]).length > 0 : false,
      isFollowingAuthor,
      comments: work.comments,
    });
  } catch (error) {
    console.error("GET /api/works/[id] error:", error);
    return NextResponse.json(
      { error: "作品が見つかりません" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const work = await prisma.work.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });

    if (!work) {
      return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
    }
    if (work.authorId !== session.user.id) {
      return NextResponse.json({ error: "自分の作品のみ編集できます" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, genreSlugs } = body as {
      title?: string;
      description?: string;
      genreSlugs?: string[];
    };

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;

    // タグ更新: slugで既存Tagを検索して紐づけ
    if (genreSlugs !== undefined) {
      const tags = await prisma.tag.findMany({
        where: { slug: { in: genreSlugs } },
      });
      data.tags = { set: tags.map((t) => ({ id: t.id })) };
    }

    const updated = await prisma.work.update({
      where: { id: params.id },
      data,
      include: {
        tags: { select: { name: true, slug: true, emoji: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      genres: updated.tags,
    });
  } catch (error) {
    console.error("PATCH /api/works/[id] error:", error);
    return NextResponse.json({ error: "作品の更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const work = await prisma.work.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    });

    if (!work) {
      return NextResponse.json(
        { error: "作品が見つかりません" },
        { status: 404 }
      );
    }

    if (work.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "自分の作品のみ削除できます" },
        { status: 403 }
      );
    }

    await prisma.work.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/works/[id] error:", error);
    return NextResponse.json(
      { error: "作品の削除に失敗しました" },
      { status: 500 }
    );
  }
}
