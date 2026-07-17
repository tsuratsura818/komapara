import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSignedRequest } from "@/lib/meta-signed-request";

/**
 * Instagramの「データ削除リクエスト」でMetaから呼ばれる（App Review必須）。
 * Metaの仕様上、確認URLと確認コードをJSONで返す必要がある。
 *
 * 削除するのは「コマパラがInstagramから受け取ったデータ」＝連携情報のみ。
 * 作品は作家自身がコマパラに投稿した資産なので、ここでは消さない
 * （アカウント自体の削除は別途 /settings から行う導線とする）。
 */
export async function POST(request: NextRequest) {
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://komapara.com";

  if (!appSecret) {
    console.error("data-deletion: INSTAGRAM_APP_SECRET 未設定");
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

    const igUserId = payload.user_id;
    await prisma.instagramAccount.deleteMany({ where: { igUserId } });

    // Metaはこの2つを必須で要求する（確認URL・確認コード）
    return NextResponse.json({
      url: `${base}/instagram-data-deletion?id=${encodeURIComponent(igUserId)}`,
      confirmation_code: igUserId,
    });
  } catch (err) {
    console.error("POST /api/instagram/data-deletion error:", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
