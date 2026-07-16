import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { getMediaById, imageUrlsFromMedia } from "@/lib/instagram";
import { fetchImageSafely } from "@/lib/safe-image-fetch";
import { processImageToWebP } from "@/lib/image";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { rateLimit } from "@/lib/rate-limit";

// 選択した投稿を取り込み → パネルURL(WebP/Blob)を返す（アップロードウィザードが利用）
export async function POST(request: NextRequest) {
  const { error, session } = await requireUser();
  if (error) return error;

  const { success } = await rateLimit(`ig:import:${session.user.id}`, {
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json({ error: "取り込みの上限に達しました" }, { status: 429 });
  }

  const acc = await prisma.instagramAccount.findUnique({
    where: { userId: session.user.id },
  });
  if (!acc) {
    return NextResponse.json({ error: "Instagram未連携です" }, { status: 400 });
  }

  const { mediaId } = (await request.json().catch(() => ({}))) as { mediaId?: string };
  if (!mediaId) {
    return NextResponse.json({ error: "mediaId が必要です" }, { status: 400 });
  }

  const target = await getMediaById(acc.accessToken, mediaId);
  if (!target) {
    return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });
  }

  const urls = imageUrlsFromMedia(target);
  if (urls.length === 0) {
    return NextResponse.json({ error: "この投稿に画像が含まれていません" }, { status: 400 });
  }

  // カルーセル全コマ / 単一画像を原寸で取得 → WebP → Blob
  const savedUrls: string[] = [];
  let lastError = "";
  for (const u of urls) {
    try {
      const buffer = await fetchImageSafely(u, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        },
      });
      const uuid = randomUUID();
      const processed = await processImageToWebP(buffer, uuid);
      const blob = await put(`panels/${processed.filename}`, processed.buffer, {
        access: "public",
        contentType: "image/webp",
      });
      savedUrls.push(blob.url);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      console.error("Instagram import image error:", u.slice(0, 80), lastError);
    }
  }

  if (savedUrls.length === 0) {
    return NextResponse.json(
      { error: `画像の取り込みに失敗しました（${lastError || "原因不明"}）` },
      { status: 502 }
    );
  }

  return NextResponse.json({ panels: savedUrls, caption: target.caption ?? "" });
}
