import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const [totals, recentTips] = await Promise.all([
      prisma.tip.aggregate({
        where: { paymentStatus: "completed" },
        _sum: { amount: true, platformFee: true, netAmount: true },
        _count: true,
      }),
      prisma.tip.findMany({
        include: {
          sender: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true, image: true } },
          work: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      totalAmount: totals._sum.amount || 0,
      totalFees: totals._sum.platformFee || 0,
      totalNetAmount: totals._sum.netAmount || 0,
      tipCount: totals._count,
      recentTips,
    });
  } catch (error) {
    console.error("GET /api/admin/tips error:", error);
    return NextResponse.json(
      { error: "投げ銭統計の取得に失敗しました" },
      { status: 500 }
    );
  }
}
