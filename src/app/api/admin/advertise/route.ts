import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const ads = await prisma.advertisement.findMany({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ads });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const { title, company, imageUrl, linkUrl, description, placement, isActive, startDate, endDate, sortOrder } = body;

  if (!title || !company || !imageUrl || !linkUrl) {
    return NextResponse.json({ error: "必須項目が未入力です" }, { status: 400 });
  }

  const ad = await prisma.advertisement.create({
    data: {
      title,
      company,
      imageUrl,
      linkUrl,
      description: description || null,
      placement: placement ?? "feed",
      isActive: isActive ?? true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(ad, { status: 201 });
}
