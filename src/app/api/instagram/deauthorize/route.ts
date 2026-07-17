import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSignedRequest } from "@/lib/meta-signed-request";

/**
 * Instagram側で「アプリを削除」された時にMetaから呼ばれる（App Review必須）。
 * 連携情報（長期トークン）を破棄する。作品は作家の資産なので消さない。
 */
export async function POST(request: NextRequest) {
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appSecret) {
    console.error("deauthorize: INSTAGRAM_APP_SECRET 未設定");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  try {
    // Content-Typeが不正だと formData() が投げる。不正入力は500でなく400で返す
    let signedRequest: string | null = null;
    try {
      const form = await request.formData();
      const v = form.get("signed_request");
      if (typeof v === "string") signedRequest = v;
    } catch {
      signedRequest = null;
    }
    if (!signedRequest) {
      return NextResponse.json({ error: "signed_request required" }, { status: 400 });
    }

    const payload = parseSignedRequest(signedRequest, appSecret);
    if (!payload?.user_id) {
      return NextResponse.json({ error: "invalid signed_request" }, { status: 400 });
    }

    // 連携解除＝トークンを保持し続ける理由が無くなる。作品は残す
    await prisma.instagramAccount.deleteMany({ where: { igUserId: payload.user_id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/instagram/deauthorize error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
