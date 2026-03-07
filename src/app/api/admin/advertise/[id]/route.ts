import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json();
  const { title, company, imageUrl, linkUrl, description, placement, isActive, startDate, endDate, sortOrder } = body;

  const ad = await prisma.advertisement.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(company !== undefined && { company }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(linkUrl !== undefined && { linkUrl }),
      ...(description !== undefined && { description: description || null }),
      ...(placement !== undefined && { placement }),
      ...(isActive !== undefined && { isActive }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json(ad);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdminApi();
  if (error) return error;

  await prisma.advertisement.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
