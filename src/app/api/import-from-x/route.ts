import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { processImageToWebP } from "@/lib/image";

function extractTweetId(url: string): string | null {
  const match = url.match(
    /(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/
  );
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

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

    // fxtwitter API で投稿データを取得
    let tweet;
    try {
      const apiRes = await fetch(
        `https://api.fxtwitter.com/status/${tweetId}`,
        { headers: { "User-Agent": "Komapara/1.0" }, signal: AbortSignal.timeout(10000) }
      );
      if (!apiRes.ok) {
        return NextResponse.json(
          { error: "X投稿の取得に失敗しました。URLが正しいか確認してください" },
          { status: 404 }
        );
      }
      const data = await apiRes.json();
      tweet = data.tweet;
    } catch (e) {
      console.error("fxtwitter fetch error:", e);
      return NextResponse.json(
        { error: "X投稿の取得中にエラーが発生しました" },
        { status: 502 }
      );
    }

    if (!tweet) {
      return NextResponse.json(
        { error: "投稿データが見つかりませんでした" },
        { status: 404 }
      );
    }

    const photos = tweet.media?.photos || tweet.media?.all?.filter(
      (m: { type: string }) => m.type === "photo"
    ) || [];

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

      // 画像ダウンロード
      let buffer: Buffer;
      try {
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
        if (!imgRes.ok) {
          console.error(`Image download failed: ${imgRes.status} for ${imageUrl}`);
          continue;
        }
        buffer = Buffer.from(await imgRes.arrayBuffer());
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
        const blob = await put(`panels/${processed.filename}`, processed.buffer, {
          access: "public",
          contentType: "image/webp",
        });
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
