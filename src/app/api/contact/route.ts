import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/utils";

const CATEGORIES: Record<string, string> = {
  general: "一般的なお問い合わせ",
  bug: "不具合の報告",
  feature: "機能要望",
  account: "アカウントについて",
  other: "その他",
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "不正なリクエスト" }, { status: 400 });
  }

  const { name, email, category, message } = body as {
    name: string;
    email: string;
    category: string;
    message: string;
  };

  // バリデーション
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "お名前・メールアドレス・お問い合わせ内容は必須です" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "メールアドレスの形式が正しくありません" },
      { status: 400 }
    );
  }
  if (message.trim().length > 2000) {
    return NextResponse.json(
      { error: "お問い合わせ内容は2000文字以内でお願いします" },
      { status: 400 }
    );
  }
  if (category && !CATEGORIES[category]) {
    return NextResponse.json({ error: "不正なカテゴリ" }, { status: 400 });
  }

  const categoryLabel = CATEGORIES[category] || CATEGORIES.general;

  if (!process.env.RESEND_API_KEY || !process.env.ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "メール設定が完了していません" },
      { status: 500 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    // 送信元は認証済みドメインが必要。Resend無料枠は1ドメインまでで、その枠は
    // tsuratsura.com が使用中のため komapara.com は登録できない（要有料プラン）。
    from: "コマパラお問い合わせ <noreply@tsuratsura.com>",
    to: process.env.ADMIN_EMAIL,
    replyTo: email,
    subject: `【コマパラ】${categoryLabel}: ${name}様より`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
      <h2>お問い合わせが届きました</h2>
      <table style="border-collapse:collapse;width:100%;max-width:500px;">
        <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">お名前</td><td style="padding:8px;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">メール</td><td style="padding:8px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">カテゴリ</td><td style="padding:8px;">${categoryLabel}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;vertical-align:top;">内容</td><td style="padding:8px;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>
      </table>
    </body></html>`.trim(),
  });

  if (error) {
    // 失敗の中身をログに残す。残さないと「問い合わせが来ない」原因を追えない
    console.error("contact: Resend送信失敗:", error);
    return NextResponse.json(
      { error: "送信に失敗しました。時間をおいて再度お試しください" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
