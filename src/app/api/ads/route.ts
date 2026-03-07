import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement") ?? "feed";

  const now = new Date();

  const ads = await prisma.advertisement.findMany({
    where: {
      isActive: true,
      placement: { in: [placement, "all"] },
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    },
    orderBy: { sortOrder: "desc" },
    select: {
      id: true,
      company: true,
      imageUrl: true,
      linkUrl: true,
      description: true,
    },
  });

  return NextResponse.json({ ads });
}
