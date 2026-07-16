import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  // DB疎通のboolだけは公開（アップタイム監視用）。詳細は管理者のみ。
  const checks: Record<string, unknown> = {};

  try {
    await prisma.user.count();
    checks.db = { ok: true };
  } catch {
    checks.db = { ok: false };
  }

  // 管理者以外にはenv構成・件数・セッション詳細を出さない（情報漏えい防止）
  const session = await auth().catch(() => null);
  const isAdmin = !!session?.user?.id && isAdminUser(session.user.id);
  if (!isAdmin) {
    return NextResponse.json(checks);
  }

  try {
    const userCount = await prisma.user.count();
    checks.db = { ok: true, userCount };
  } catch (e: unknown) {
    checks.db = { ok: false, error: (e as Error).message };
  }

  checks.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    ADMIN_USER_IDS: process.env.ADMIN_USER_IDS ? "set" : "missing",
  };
  checks.auth = { ok: true, session: { userId: session!.user!.id } };

  return NextResponse.json(checks);
}
