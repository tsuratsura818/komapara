import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * 閲覧計上エンドポイント（ビーコン）。
 * クライアント(WorkViewer)のマウント時に1回だけ叩かれる。
 * GETの副作用ではなくこのPOSTに集約することで、bot/プリフェッチ/リンクプレビューでの
 * 過剰カウントを避け、作品詳細ページをキャッシュ可能に保つ。
 */
export async function POST(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  try {
    await prisma.work.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const session = await auth();
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
