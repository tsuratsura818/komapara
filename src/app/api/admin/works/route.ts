import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (q) {
      where.title = { contains: q, mode: "insensitive" };
    }

    const [works, totalCount] = await Promise.all([
      prisma.work.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.work.count({ where }),
    ]);

    return NextResponse.json({
      works,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error("GET /api/admin/works error:", err);
    return NextResponse.json(
      { error: "作品一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
