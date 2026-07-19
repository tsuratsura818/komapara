import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePositiveInt } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { notifyFollowers } from "@/lib/notifications";
import { requireUser } from "@/lib/admin";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "new";
    const genre = searchParams.get("genre");
    const q = searchParams.get("q")?.trim();
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
    const skip = (page - 1) * limit;

    const session = await auth();

    const where: Record<string, unknown> = { isPublished: true };

    if (genre) {
      where.tags = { some: { slug: genre } };
    }

    // キーワード検索（トップのフィードから画面遷移せずに絞り込むため）
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { author: { is: { name: { contains: q, mode: "insensitive" } } } },
      ];
    }

    if (sort === "following" && session?.user?.id) {
      const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      });
      where.authorId = { in: following.map((f) => f.followingId) };
    }

    const orderBy =
      sort === "popular"
        ? { likeCount: "desc" as const }
        : { createdAt: "desc" as const };

    const [works, totalCount] = await Promise.all([
      prisma.work.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: { select: { name: true, slug: true, emoji: true } },
          ...(session?.user?.id
            ? {
                likes: {
                  where: { userId: session.user.id },
                  select: { id: true },
                },
              }
            : {}),
        },
      }),
      prisma.work.count({ where }),
    ]);

    const result = works.map((work) => ({
      id: work.id,
      title: work.title,
      panels: work.panels,
      author: work.author,
      genres: work.tags,
      likeCount: work.likeCount,
      viewCount: work.viewCount,
      createdAt: work.createdAt,
      isLiked: "likes" in work ? (work.likes as unknown[]).length > 0 : false,
    }));

    return NextResponse.json({
      works: result,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("GET /api/works error:", error);
    return NextResponse.json(
      { error: "作品一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireUser();
    if (error) return error;

    const { success } = await rateLimit(`works:post:${session.user.id}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "投稿制限に達しました。しばらくしてからお試しください" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title, description, panels, genreSlugs, seriesId, xPostUrl } = body;

    if (!title || !panels || !Array.isArray(panels) || panels.length < 1 || panels.length > 16) {
      return NextResponse.json(
        { error: "タイトルと1〜16枚の画像が必要です" },
        { status: 400 }
      );
    }

    if (title.length > 50) {
      return NextResponse.json(
        { error: "タイトルは50文字以内にしてください" },
        { status: 400 }
      );
    }

    // クリエイターフラグを立てる
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isCreator: true },
    });

    const work = await prisma.work.create({
      data: {
        title,
        description: description || null,
        panels,
        authorId: session.user.id,
        xPostUrl: xPostUrl || null,
        ...(seriesId ? { seriesId, seriesOrder: await getNextSeriesOrder(seriesId) } : {}),
        ...(genreSlugs?.length
          ? { tags: { connect: genreSlugs.map((slug: string) => ({ slug })) } }
          : {}),
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { select: { name: true, slug: true, emoji: true } },
      },
    });

    // フォロワーに通知（バックグラウンドで実行、投稿レスポンスをブロックしない）
    notifyFollowers(
      session.user.id,
      work.author.name || "クリエイター",
      work.id,
      work.title,
      work.panels[0]
    ).catch((err) => console.error("Follower notification error:", err));

    // ISRキャッシュを無効化して新作を即時反映（ホーム・ジャンル一覧）
    revalidatePath("/");
    revalidatePath("/genre/[slug]", "page");

    return NextResponse.json(work, { status: 201 });
  } catch (error) {
    console.error("POST /api/works error:", error);
    return NextResponse.json(
      { error: "作品の投稿に失敗しました" },
      { status: 500 }
    );
  }
}

async function getNextSeriesOrder(seriesId: string): Promise<number> {
  const max = await prisma.work.aggregate({
    where: { seriesId },
    _max: { seriesOrder: true },
  });
  return (max._max.seriesOrder || 0) + 1;
}
