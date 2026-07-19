import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePositiveInt } from "@/lib/utils";
import { requireAdminApi } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isCreator: true,
          isBanned: true,
          createdAt: true,
          _count: { select: { works: true, comments: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json(
      { error: "ユーザー一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}
