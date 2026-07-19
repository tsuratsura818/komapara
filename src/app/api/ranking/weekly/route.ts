import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePositiveInt } from "@/lib/utils";
import { getWeekStart } from "@/lib/ranking";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);

    const weekStart = getWeekStart();

    const rankings = await prisma.weeklyRanking.findMany({
      where: { weekStart },
      include: {
        work: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            tags: { select: { name: true, slug: true, emoji: true } },
          },
        },
      },
      orderBy: { rank: "asc" },
      take: limit,
    });

    return NextResponse.json({
      weekStart: weekStart.toISOString().split("T")[0],
      rankings: rankings.map((r) => ({
        rank: r.rank,
        score: r.score,
        work: {
          id: r.work.id,
          title: r.work.title,
          panels: r.work.panels,
          author: r.work.author,
          genres: r.work.tags,
          likeCount: r.work.likeCount,
          viewCount: r.work.viewCount,
          createdAt: r.work.createdAt,
        },
      })),
    });
  } catch (error) {
    console.error("GET /api/ranking/weekly error:", error);
    return NextResponse.json(
      { error: "ランキングの取得に失敗しました" },
      { status: 500 }
    );
  }
}
