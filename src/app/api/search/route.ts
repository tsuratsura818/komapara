import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { success } = rateLimit(`search:${ip}`, {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "検索制限に達しました。しばらくしてからお試しください" },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "works";

    if (!q) {
      return NextResponse.json({ works: [], creators: [], totalCount: 0 });
    }

    if (type === "creators") {
      const creators = await prisma.user.findMany({
        where: {
          isCreator: true,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { xHandle: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          image: true,
          xHandle: true,
          _count: { select: { works: true, followers: true } },
        },
        take: 20,
      });

      return NextResponse.json({ creators, totalCount: creators.length });
    }

    // 作品検索
    const works = await prisma.work.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { select: { name: true, slug: true, emoji: true } },
      },
      orderBy: { likeCount: "desc" },
      take: 20,
    });

    return NextResponse.json({ works, totalCount: works.length });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { error: "検索に失敗しました" },
      { status: 500 }
    );
  }
}
