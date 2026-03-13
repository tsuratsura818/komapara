import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

// シリーズ一覧
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (authorId) where.authorId = authorId;

    const [series, totalCount] = await Promise.all([
      prisma.series.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true } },
          works: {
            where: { isPublished: true },
            orderBy: { seriesOrder: "asc" },
            select: { id: true, title: true, panels: true, likeCount: true },
          },
          _count: { select: { works: { where: { isPublished: true } } } },
        },
      }),
      prisma.series.count({ where }),
    ]);

    return NextResponse.json({
      series: series.map((s) => ({
        ...s,
        coverImage: s.coverImage || s.works[0]?.panels[0] || null,
        episodeCount: s._count.works,
        totalLikes: s.works.reduce((sum, w) => sum + w.likeCount, 0),
      })),
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("GET /api/series error:", error);
    return NextResponse.json(
      { error: "シリーズの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// シリーズ作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { success } = await rateLimit(`series:create:${session.user.id}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "作成制限に達しました" },
        { status: 429 }
      );
    }

    const { title, description } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "タイトルは必須です" },
        { status: 400 }
      );
    }
    if (title.length > 50) {
      return NextResponse.json(
        { error: "タイトルは50文字以内にしてください" },
        { status: 400 }
      );
    }

    const series = await prisma.series.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        _count: { select: { works: true } },
      },
    });

    return NextResponse.json(series, { status: 201 });
  } catch (error) {
    console.error("POST /api/series error:", error);
    return NextResponse.json(
      { error: "シリーズの作成に失敗しました" },
      { status: 500 }
    );
  }
}
