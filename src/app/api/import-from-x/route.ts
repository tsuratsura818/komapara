import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { processImageToWebP } from "@/lib/image";

function extractTweetId(url: string): string | null {
  // https://x.com/user/status/123456 or https://twitter.com/user/status/123456
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

    const { success } = rateLimit(`import-x:${session.user.id}`, {
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

    // fxtwitter API で投稿データを取得（無料・認証不要）
    const apiRes = await fetch(
      `https://api.fxtwitter.com/status/${tweetId}`,
      { headers: { "User-Agent": "Komapara/1.0" } }
    );

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: "X投稿の取得に失敗しました。URLが正しいか確認してください" },
        { status: 404 }
      );
    }

    const data = await apiRes.json();
    const tweet = data.tweet;

    if (!tweet) {
      return NextResponse.json(
        { error: "投稿データが見つかりませんでした" },
        { status: 404 }
      );
    }

    // 画像を取得
    const photos = tweet.media?.photos || tweet.media?.all?.filter(
      (m: { type: string }) => m.type === "photo"
    ) || [];

    if (photos.length === 0) {
      return NextResponse.json(
        { error: "この投稿に画像が含まれていません" },
        { status: 400 }
      );
    }

    // 画像をダウンロードしてWebP変換して保存
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const savedUrls: string[] = [];
    for (const photo of photos) {
      const imageUrl = photo.url;
      if (!imageUrl) continue;

      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) continue;

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const uuid = randomUUID();
      const processed = await processImageToWebP(buffer, uuid);
      await writeFile(path.join(uploadDir, processed.filename), processed.buffer);
      savedUrls.push(`/uploads/${processed.filename}`);
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
    return NextResponse.json(
      { error: "インポートに失敗しました" },
      { status: 500 }
    );
  }
}
