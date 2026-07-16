import { NextResponse } from "next/server";
import { requireUser } from "@/lib/admin";
import { isInstagramConfigured, buildAuthUrl } from "@/lib/instagram";
import { randomBytes } from "crypto";

// 作家がIG連携を開始 → Instagramの認可画面へリダイレクト
export async function GET() {
  const { error } = await requireUser();
  if (error) return error;
  if (!isInstagramConfigured()) {
    return NextResponse.json(
      { error: "Instagram連携は現在準備中です" },
      { status: 503 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(state));
  // CSRF対策: stateをhttpOnly cookieに保存し、callbackで照合
  res.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
