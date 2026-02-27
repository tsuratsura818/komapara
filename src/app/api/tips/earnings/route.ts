import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const [totals, recentTips] = await Promise.all([
      prisma.tip.aggregate({
        where: { receiverId: session.user.id, paymentStatus: "completed" },
        _sum: { amount: true, netAmount: true, platformFee: true },
        _count: true,
      }),
      prisma.tip.findMany({
        where: { receiverId: session.user.id, paymentStatus: "completed" },
        include: {
          sender: { select: { id: true, name: true, image: true } },
          work: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({
      totalAmount: totals._sum.amount || 0,
      totalNetAmount: totals._sum.netAmount || 0,
      totalFees: totals._sum.platformFee || 0,
      tipCount: totals._count,
      recentTips,
    });
  } catch (error) {
    console.error("GET /api/tips/earnings error:", error);
    return NextResponse.json(
      { error: "収益情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
