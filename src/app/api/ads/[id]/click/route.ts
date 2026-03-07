import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  await prisma.advertisement.update({
    where: { id: params.id },
    data: { clicks: { increment: 1 } },
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
