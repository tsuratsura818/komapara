import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * 閲覧計上エンドポイント（ビーコン）。
 * クライアント(WorkViewer)のマウント時に1回だけ叩かれる。
 * GETの副作用ではなくこのPOSTに集約することで、bot/プリフェッチ/リンクプレビューでの
 * 過剰カウントを避け、作品詳細ページをキャッシュ可能に保つ。
 *
 * ただし認証も制限も無いと、このPOSTをループするだけで閲覧数を無限に
 * 水増しでき、週間ランキング（likeCount×2 + viewCount）を操作できてしまう。
 * 同一視聴者（ログイン中はユーザーID、ゲストはIP）×作品ごとに、一定時間は
 * 1回しか計上しない。重複時は成功(ok)を返し、画面側の見え方は変えない。
 */
const VIEW_WINDOW_MS = 30 * 60 * 1000; // 同一視聴者は30分に1カウントまで

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  try {
    const session = await auth();
    const viewer = session?.user?.id
      ? `u:${session.user.id}`
      : `ip:${getClientIp(request)}`;

    // limit:1 の枠を「視聴者×作品」ごとに用意し、窓の間は2回目以降を弾く
    const { success } = await rateLimit(`view:${id}:${viewer}`, {
      limit: 1,
      windowMs: VIEW_WINDOW_MS,
    });

    if (success) {
      await prisma.work.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    // 閲覧履歴は計上の有無に関わらず最新化する（ライブラリの並び用）
    if (session?.user?.id) {
      await prisma.readHistory.upsert({
        where: { userId_workId: { userId: session.user.id, workId: id } },
        update: { readAt: new Date() },
        create: { userId: session.user.id, workId: id },
      });
    }
  } catch {
    // 作品が存在しない等でも画面表示に影響させない
  }
  return NextResponse.json({ ok: true });
}
