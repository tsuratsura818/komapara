import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const [stats, activeCount, planCount, recent] = await Promise.all([
      prisma.subscription.aggregate({
        where: { paymentStatus: "completed" },
        _sum: { amount: true, platformFee: true, netAmount: true },
        _count: true,
      }),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.subscriptionPlan.count({ where: { isActive: true } }),
      prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          subscriber: { select: { id: true, name: true, image: true } },
          creator: { select: { id: true, name: true } },
          plan: { select: { name: true, price: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalAmount: stats._sum.amount || 0,
      totalFees: stats._sum.platformFee || 0,
      totalNet: stats._sum.netAmount || 0,
      totalCount: stats._count,
      activeCount,
      planCount,
      recent,
    });
  } catch (error) {
    console.error("GET /api/admin/subscriptions error:", error);
    return NextResponse.json({ error: "統計の取得に失敗しました" }, { status: 500 });
  }
}
