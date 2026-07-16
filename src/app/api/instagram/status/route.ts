import { NextResponse } from "next/server";
import { requireUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { isInstagramConfigured } from "@/lib/instagram";

// 現在ユーザーのIG連携状態
export async function GET() {
  const { error, session } = await requireUser();
  if (error) return error;
  const acc = await prisma.instagramAccount.findUnique({
    where: { userId: session.user.id },
    select: { username: true },
  });
  return NextResponse.json({
    configured: isInstagramConfigured(),
    connected: !!acc,
    username: acc?.username ?? null,
  });
}

// 連携解除
export async function DELETE() {
  const { error, session } = await requireUser();
  if (error) return error;
  await prisma.instagramAccount.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
