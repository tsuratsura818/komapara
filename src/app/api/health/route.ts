import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // DB接続テスト
  try {
    const userCount = await prisma.user.count();
    checks.db = { ok: true, userCount };
  } catch (e: unknown) {
    const err = e as Error;
    checks.db = { ok: false, error: err.message };
  }

  // 環境変数チェック
  checks.env = {
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    DATABASE_URL: process.env.DATABASE_URL ? "set" : "missing",
    AUTH_GOOGLE_ID: !!process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: !!process.env.AUTH_GOOGLE_SECRET,
    ADMIN_USER_IDS: process.env.ADMIN_USER_IDS || "missing",
  };

  // auth テスト
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth();
    checks.auth = { ok: true, session: session ? { userId: session.user?.id } : null };
  } catch (e: unknown) {
    const err = e as Error;
    checks.auth = { ok: false, error: err.message };
  }

  return NextResponse.json(checks);
}
