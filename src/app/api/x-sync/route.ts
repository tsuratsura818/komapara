import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { processImageToWebP } from "@/lib/image";

function extractTweetId(url: string): string | null {
  const match = url.match(/(?:x\.com|twitter\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

type FetchedPost = {
  xPostUrl: string;
  tweetId: string;
  images: string[];
  text: string;
  author: string;
  is4koma: boolean;
  error?: string;
};

// 複数URLを一括取得（プレビュー用）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { success } = rateLimit(`x-sync:${session.user.id}`, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "同期制限に達しました。しばらくしてからお試しください" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { urls, action } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "URLを1つ以上入力してください" },
        { status: 400 }
      );
    }

    if (urls.length > 20) {
      return NextResponse.json(
        { error: "一度に取得できるのは20件までです" },
        { status: 400 }
      );
    }

    // action === "fetch": プレビュー取得のみ
    // action === "import": 画像保存 + 作品作成
    if (action === "import") {
      return handleImport(request, session.user.id, body);
    }

    // デフォルト: プレビュー取得
    const results: FetchedPost[] = await Promise.all(
      urls.map(async (url: string): Promise<FetchedPost> => {
        const tweetId = extractTweetId(url);
        if (!tweetId) {
          return {
            xPostUrl: url,
            tweetId: "",
            images: [],
            text: "",
            author: "",
            is4koma: false,
            error: "無効なURL",
          };
        }

        try {
          const apiRes = await fetch(
            `https://api.fxtwitter.com/status/${tweetId}`,
            { headers: { "User-Agent": "Komapara/1.0" } }
          );

          if (!apiRes.ok) {
            return {
              xPostUrl: url,
              tweetId,
              images: [],
              text: "",
              author: "",
              is4koma: false,
              error: "投稿を取得できませんでした",
            };
          }

          const data = await apiRes.json();
          const tweet = data.tweet;
          if (!tweet) {
            return {
              xPostUrl: url,
              tweetId,
              images: [],
              text: "",
              author: "",
              is4koma: false,
              error: "投稿データなし",
            };
          }

          const photos =
            tweet.media?.photos ||
            tweet.media?.all?.filter(
              (m: { type: string }) => m.type === "photo"
            ) ||
            [];

          const imageUrls = photos.map((p: { url: string }) => p.url);
          const cleanText = (tweet.text || "")
            .replace(/https?:\/\/\S+/g, "")
            .replace(/#\S+/g, "")
            .trim();

          return {
            xPostUrl: url,
            tweetId,
            images: imageUrls,
            text: cleanText,
            author: tweet.author?.screen_name || "",
            is4koma: imageUrls.length === 4,
          };
        } catch {
          return {
            xPostUrl: url,
            tweetId,
            images: [],
            text: "",
            author: "",
            is4koma: false,
            error: "取得エラー",
          };
        }
      })
    );

    return NextResponse.json({ posts: results });
  } catch (error) {
    console.error("POST /api/x-sync error:", error);
    return NextResponse.json(
      { error: "X同期に失敗しました" },
      { status: 500 }
    );
  }
}

// 選択した投稿を一括インポート
async function handleImport(
  _request: NextRequest,
  userId: string,
  body: { posts: Array<{ xPostUrl: string; title: string; description?: string; genreSlugs?: string[]; images: string[] }> }
) {
  const { posts } = body;

  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return NextResponse.json(
      { error: "インポートする投稿を選択してください" },
      { status: 400 }
    );
  }

  if (posts.length > 10) {
    return NextResponse.json(
      { error: "一度にインポートできるのは10件までです" },
      { status: 400 }
    );
  }

  // クリエイターフラグを立てる
  await prisma.user.update({
    where: { id: userId },
    data: { isCreator: true },
  });

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const results = [];

  for (const post of posts) {
    if (!post.title?.trim()) {
      results.push({ xPostUrl: post.xPostUrl, error: "タイトルが必要です", workId: null });
      continue;
    }

    if (!post.images || post.images.length !== 4) {
      results.push({ xPostUrl: post.xPostUrl, error: "4枚の画像が必要です", workId: null });
      continue;
    }

    try {
      // 画像をダウンロードしてWebP変換
      const savedUrls: string[] = [];
      for (const imageUrl of post.images) {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error("画像ダウンロード失敗");

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const uuid = randomUUID();
        const processed = await processImageToWebP(buffer, uuid);
        await writeFile(path.join(uploadDir, processed.filename), processed.buffer);
        savedUrls.push(`/uploads/${processed.filename}`);
      }

      // 作品作成
      const work = await prisma.work.create({
        data: {
          title: post.title.trim().slice(0, 50),
          description: post.description?.trim()?.slice(0, 200) || null,
          panels: savedUrls,
          authorId: userId,
          xPostUrl: post.xPostUrl,
          ...(post.genreSlugs?.length
            ? { tags: { connect: post.genreSlugs.map((slug) => ({ slug })) } }
            : {}),
        },
      });

      results.push({ xPostUrl: post.xPostUrl, workId: work.id, error: null });
    } catch (err) {
      console.error("Import error for", post.xPostUrl, err);
      results.push({
        xPostUrl: post.xPostUrl,
        error: "インポートに失敗しました",
        workId: null,
      });
    }
  }

  return NextResponse.json({ results });
}
