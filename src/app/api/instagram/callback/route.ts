import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exchangeCode, toLongLivedToken, getProfile } from "@/lib/instagram";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://komapara.com";

// Instagram認可後のコールバック → トークン交換 → 接続情報を保存
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const back = (q: string) => NextResponse.redirect(`${BASE}/upload?${q}`);

  if (oauthError || !code) return back("ig=denied");

  const cookieState = request.cookies.get("ig_oauth_state")?.value;
  if (!state || !cookieState || state !== cookieState) return back("ig=state_error");

  const session = await auth();
  if (!session?.user?.id) return back("ig=auth_error");

  try {
    const short = await exchangeCode(code);
    if (!short) return back("ig=exchange_error");

    const long = await toLongLivedToken(short.accessToken);
    const token = long?.accessToken ?? short.accessToken;
    const expiresIn = long?.expiresIn ?? 3600;
    const profile = await getProfile(token);

    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    await prisma.instagramAccount.upsert({
      where: { userId: session.user.id },
      update: {
        igUserId: short.userId,
        username: profile?.username ?? null,
        accessToken: token,
        tokenExpiry,
      },
      create: {
        userId: session.user.id,
        igUserId: short.userId,
        username: profile?.username ?? null,
        accessToken: token,
        tokenExpiry,
      },
    });

    const res = back("ig=connected");
    res.cookies.delete("ig_oauth_state");
    return res;
  } catch (e) {
    console.error("Instagram callback error:", e);
    return back("ig=error");
  }
}
