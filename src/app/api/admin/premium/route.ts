import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const [stats, activeCount, recent] = await Promise.all([
      prisma.premiumSubscription.aggregate({
        where: { paymentStatus: "completed" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.premiumSubscription.count({ where: { status: "active" } }),
      prisma.premiumSubscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalAmount: stats._sum.amount || 0,
      totalCount: stats._count,
      activeCount,
      recent,
    });
  } catch (error) {
    console.error("GET /api/admin/premium error:", error);
    return NextResponse.json(
      { error: "統計の取得に失敗しました" },
      { status: 500 }
    );
  }
}
