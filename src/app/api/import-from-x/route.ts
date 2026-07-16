import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/admin";
import { putImage } from "@/lib/blob";
import { randomUUID } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { processImageToWebP } from "@/lib/image";
import { fetchImageSafely } from "@/lib/safe-image-fetch";

function extractTweetId(url: string): string | null {
  const match = url.match(
    /(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/
  );
  return match ? match[1] : null;
}

type TweetData = {
  text: string;
  author: { screen_name: string };
  media: { photos: { url: string }[] };
};

// fxtwitter を主、vxtwitter を予備に。片方が落ちても取得を継続できるようにする
async function fetchTweetData(tweetId: string): Promise<TweetData | null> {
  const ua = { "User-Agent": "Komapara/1.0" };

  // 1) fxtwitter（media.photos に全画像）
  try {
    const r = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: ua,
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) {
      const d = await r.json();
      const t = d?.tweet;
      if (t) {
        const photos =
          t.media?.photos ||
          (t.media?.all || []).filter((m: { type: string }) => m.type === "photo");
        if ((photos && photos.length) || t.text) {
          return {
            text: t.text || "",
            author: { screen_name: t.author?.screen_name || "" },
            media: { photos: photos || [] },
          };
        }
      }
    }
  } catch (e) {
    console.error("fxtwitter error:", e);
  }

  // 2) vxtwitter フォールバック（media_extended から画像URL）
  try {
    const r = await fetch(`https://api.vxtwitter.com/status/${tweetId}`, {
      headers: ua,
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) {
      const d = await r.json();
      const photos: { url: string }[] = (d?.media_extended || [])
        .filter((m: { type: string }) => m.type === "image")
        .map((m: { url: string }) => ({ url: m.url }));
      if (photos.length || d?.text) {
        return {
          text: d?.text || "",
          author: { screen_name: d?.user_screen_name || "" },
          media: { photos },
        };
      }
    }
  } catch (e) {
    console.error("vxtwitter error:", e);
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireUser();
    if (error) return error;

    const { success } = await rateLimit(`import-x:${session.user.id}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "インポート制限に達しました。しばらくしてからお試しください" },
        { status: 429 }
      );
    }

    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URLを入力してください" },
        { status: 400 }
      );
    }

    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return NextResponse.json(
        { error: "有効なX投稿URLを入力してください（例: https://x.com/user/status/123456）" },
        { status: 400 }
      );
    }

    // 投稿データを取得（fxtwitter → vxtwitter フォールバックで単一障害点を回避）
    const tweet = await fetchTweetData(tweetId);
    if (!tweet) {
      return NextResponse.json(
        { error: "X投稿の取得に失敗しました。URLが正しいか、公開投稿か確認してください" },
        { status: 404 }
      );
    }

    const photos = tweet.media.photos;

    if (photos.length === 0) {
      return NextResponse.json(
        { error: "この投稿に画像が含まれていません" },
        { status: 400 }
      );
    }

    // 画像をダウンロード → WebP変換 → Vercel Blobに保存
    const savedUrls: string[] = [];
    for (const photo of photos) {
      const imageUrl = photo.url;
      if (!imageUrl) continue;

      // 画像ダウンロード（SSRF対策済みの安全なfetch）
      let buffer: Buffer;
      try {
        buffer = await fetchImageSafely(imageUrl);
      } catch (e) {
        console.error("Image download error:", e);
        continue;
      }

      // WebP変換
      let processed;
      try {
        const uuid = randomUUID();
        processed = await processImageToWebP(buffer, uuid);
      } catch (e) {
        console.error("WebP conversion error:", e);
        // WebP変換失敗時は元画像のURLをそのまま使用
        savedUrls.push(imageUrl);
        continue;
      }

      // Vercel Blobにアップロード
      try {
        const blob = await putImage(`panels/${processed.filename}`, processed.buffer);
        savedUrls.push(blob.url);
      } catch (e) {
        console.error("Vercel Blob upload error:", e);
        // Blob保存失敗時は元画像のURLをそのまま使用
        savedUrls.push(imageUrl);
      }
    }

    if (savedUrls.length === 0) {
      return NextResponse.json(
        { error: "画像のダウンロードに失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      images: savedUrls,
      text: tweet.text || "",
      author: tweet.author?.screen_name || "",
      xPostUrl: url,
    });
  } catch (error) {
    console.error("POST /api/import-from-x error:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { error: `インポートに失敗しました: ${message}` },
      { status: 500 }
    );
  }
}
