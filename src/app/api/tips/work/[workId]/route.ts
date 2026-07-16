import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest, props: { params: Promise<{ workId: string }> }) {
  const params = await props.params;
  try {
    const [tips, aggregate] = await Promise.all([
      prisma.tip.findMany({
        where: { workId: params.workId, paymentStatus: "completed" },
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.tip.aggregate({
        where: { workId: params.workId, paymentStatus: "completed" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      tips,
      totalAmount: aggregate._sum.amount || 0,
      tipCount: aggregate._count,
    });
  } catch (error) {
    console.error("GET /api/tips/work error:", error);
    return NextResponse.json(
      { error: "投げ銭情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
