import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const REASONS: Record<string, string> = {
  spam: "スパム・宣伝",
  inappropriate: "不適切なコンテンツ",
  copyright: "著作権侵害",
  other: "その他",
};

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { reason, detail } = await request.json();
  if (!reason || !REASONS[reason]) {
    return NextResponse.json({ error: "理由を選択してください" }, { status: 400 });
  }

  const work = await prisma.work.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, authorId: true },
  });
  if (!work) {
    return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
  }
  if (work.authorId === session.user.id) {
    return NextResponse.json({ error: "自分の作品は通報できません" }, { status: 400 });
  }

  try {
    const report = await prisma.report.create({
      data: {
        workId: params.id,
        reporterId: session.user.id,
        reason,
        detail: detail?.trim() || null,
      },
    });

    // Resendでメール通知
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "コマパラ通知 <noreply@tsuratsura.com>",
        to: process.env.ADMIN_EMAIL,
        subject: `【コマパラ】通報が届きました: ${work.title}`,
        html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
          <h2>新しい通報が届きました</h2>
          <ul>
            <li><strong>作品:</strong> ${work.title}</li>
            <li><strong>理由:</strong> ${REASONS[reason]}</li>
            ${detail ? `<li><strong>詳細:</strong> ${detail}</li>` : ""}
          </ul>
          <p><a href="${process.env.NEXTAUTH_URL}/admin/reports">管理画面で確認する →</a></p>
        </body></html>`.trim(),
      }).catch((e) => {
        // 通報自体はDBに保存済みなので、メール失敗でAPIを失敗にはしない。
        // ただし握りつぶすと通知が来ない原因を追えないためログには残す
        console.error("report: Resend送信失敗:", e);
      });
    }

    return NextResponse.json({ success: true, reportId: report.id });
  } catch {
    // unique制約違反（重複通報）
    return NextResponse.json({ error: "すでにこの作品を通報済みです" }, { status: 409 });
  }
}
