import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await prisma.advertisement.update({
    where: { id: params.id },
    data: { clicks: { increment: 1 } },
  }).catch(() => null);

  return NextResponse.json({ ok: true });
}
