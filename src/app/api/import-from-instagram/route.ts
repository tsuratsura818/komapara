import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { processImageToWebP } from "@/lib/image";

function extractShortcode(url: string): string | null {
  // https://www.instagram.com/p/SHORTCODE/
  // https://www.instagram.com/reel/SHORTCODE/
  // https://instagram.com/p/SHORTCODE/
  const match = url.match(
    /(?:www\.)?instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/
  );
  return match ? match[1] : null;
}

async function fetchViaOEmbed(url: string): Promise<{
  text: string;
  thumbnailUrl: string | null;
  author: string;
}> {
  // Instagram oEmbed API (公式)
  // FB App credentials があれば Graph API 経由、なければ直接 oEmbed
  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

  let oembedUrl: string;
  if (appId && appSecret) {
    oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${appId}|${appSecret}`;
  } else {
    // 公開 oEmbed（FB credentials 不要だが制限あり）
    oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;
  }

  const res = await fetch(oembedUrl, {
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`oEmbed API error: ${res.status}`);
  }

  const data = await res.json();
  return {
    text: data.title || "",
    thumbnailUrl: data.thumbnail_url || null,
    author: data.author_name || "",
  };
}

async function fetchViaPageScraping(url: string): Promise<{
  text: string;
  imageUrls: string[];
  author: string;
}> {
  // Instagram ページの OG メタタグから情報を取得
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Page fetch error: ${res.status}`);
  }

  const html = await res.text();

  // OG メタタグを正規表現でパース
  const ogImage = html.match(
    /<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"/
  )?.[1];
  const ogDescription = html.match(
    /<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/
  )?.[1];
  const ogTitle = html.match(
    /<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/
  )?.[1];

  // author を og:title から抽出 ("Author on Instagram: ..." or "@author ...")
  let author = "";
  if (ogTitle) {
    const authorMatch = ogTitle.match(/^(.+?)(?:\s+on\s+Instagram|\s*[（(])/);
    if (authorMatch) {
      author = authorMatch[1].replace(/^@/, "").trim();
    } else {
      author = ogTitle.split(/[:\-–—]/)[0].replace(/^@/, "").trim();
    }
  }

  // HTML エンティティをデコード
  const decodeHtml = (s: string) =>
    s
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/");

  const imageUrls: string[] = [];
  if (ogImage) {
    imageUrls.push(decodeHtml(ogImage));
  }

  return {
    text: ogDescription ? decodeHtml(ogDescription) : "",
    imageUrls,
    author,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { success } = rateLimit(`import-ig:${session.user.id}`, {
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

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return NextResponse.json(
        {
          error:
            "有効なInstagram投稿URLを入力してください（例: https://www.instagram.com/p/ABC123/）",
        },
        { status: 400 }
      );
    }

    const canonicalUrl = `https://www.instagram.com/p/${shortcode}/`;

    // 戦略1: oEmbed API
    let text = "";
    let author = "";
    let imageUrls: string[] = [];

    try {
      const oembed = await fetchViaOEmbed(canonicalUrl);
      text = oembed.text;
      author = oembed.author;
      if (oembed.thumbnailUrl) {
        imageUrls.push(oembed.thumbnailUrl);
      }
    } catch (e) {
      console.warn("Instagram oEmbed failed, trying page scraping:", e);
      // 戦略2: ページスクレイピング（フォールバック）
      try {
        const scraped = await fetchViaPageScraping(canonicalUrl);
        text = scraped.text;
        author = scraped.author;
        imageUrls = scraped.imageUrls;
      } catch (e2) {
        console.error("Instagram page scraping also failed:", e2);
        return NextResponse.json(
          {
            error:
              "Instagram投稿の取得に失敗しました。投稿が公開設定か確認してください",
          },
          { status: 502 }
        );
      }
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "この投稿から画像を取得できませんでした" },
        { status: 400 }
      );
    }

    // 画像をダウンロード → WebP変換 → Vercel Blobに保存
    const savedUrls: string[] = [];
    for (const imageUrl of imageUrls) {
      let buffer: Buffer;
      try {
        const imgRes = await fetch(imageUrl, {
          signal: AbortSignal.timeout(15000),
        });
        if (!imgRes.ok) {
          console.error(
            `Image download failed: ${imgRes.status} for ${imageUrl}`
          );
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
        savedUrls.push(imageUrl);
        continue;
      }

      // Vercel Blobにアップロード
      try {
        const blob = await put(
          `panels/${processed.filename}`,
          processed.buffer,
          {
            access: "public",
            contentType: "image/webp",
          }
        );
        savedUrls.push(blob.url);
      } catch (e) {
        console.error("Vercel Blob upload error:", e);
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
      text,
      author,
      sourceUrl: canonicalUrl,
    });
  } catch (error) {
    console.error("POST /api/import-from-instagram error:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json(
      { error: `インポートに失敗しました: ${message}` },
      { status: 500 }
    );
  }
}
