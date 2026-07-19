import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePositiveInt } from "@/lib/utils";
import { requireAdminApi } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true } },
          work: { select: { id: true, title: true } },
        },
      }),
      prisma.comment.count(),
    ]);

    return NextResponse.json({
      comments,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error("GET /api/admin/comments error:", err);
    return NextResponse.json(
      { error: "コメント一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
