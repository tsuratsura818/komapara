import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { processImageToWebP } from "@/lib/image";

function extractShortcode(url: string): string | null {
  const match = url.match(
    /(?:www\.)?instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/
  );
  return match ? match[1] : null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\/g, "");
}

// Instagram ページから埋め込みデータを取得（カルーセル全画像対応）
async function fetchFromInstagramPage(shortcode: string): Promise<{
  text: string;
  imageUrls: string[];
  author: string;
}> {
  const url = `https://www.instagram.com/p/${shortcode}/`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Instagram page fetch failed: ${res.status}`);
  }

  const html = await res.text();

  // OG メタタグからキャプション・author・メイン画像を取得
  const ogDescription =
    html.match(
      /<meta\s+(?:property|name)="og:description"\s+content="([^"]*?)"/
    )?.[1] ?? "";
  const ogTitle =
    html.match(
      /<meta\s+(?:property|name)="og:title"\s+content="([^"]*?)"/
    )?.[1] ?? "";
  const ogImage =
    html.match(
      /<meta\s+(?:property|name)="og:image"\s+content="([^"]*?)"/
    )?.[1] ?? "";

  let author = "";
  if (ogTitle) {
    // "Author on Instagram: ..." or "AuthorはInstagramを利用しています..."
    const m =
      ogTitle.match(/^(.+?)(?:\s+on\s+Instagram|\s*はInstagram)/) ??
      ogTitle.match(/^@?([^:–—\-]+)/);
    if (m) author = m[1].replace(/^@/, "").trim();
  }

  const text = ogDescription ? decodeHtml(ogDescription) : "";
  const imageUrls: string[] = [];

  // 戦略1: ページ内の埋め込みJSONからカルーセル画像を抽出
  // Instagram は script タグ内に投稿データを埋め込んでいる
  try {
    // xdt_api__v1__media__shortcode__web_info パターンを探す
    const jsonPattern =
      /"xdt_api__v1__media__shortcode__web_info"\s*:\s*(\{[\s\S]*?\})\s*,\s*"extensions"/;
    const jsonMatch = html.match(jsonPattern);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      const items = parsed?.items ?? [];
      for (const item of items) {
        // カルーセルの場合
        if (item.carousel_media) {
          for (const cm of item.carousel_media) {
            const candidates =
              cm.image_versions2?.candidates ?? [];
            if (candidates.length > 0) {
              // 最大解像度の画像を選択
              const best = candidates.reduce(
                (a: { width: number }, b: { width: number }) =>
                  a.width > b.width ? a : b
              );
              imageUrls.push(best.url);
            }
          }
        } else {
          // 単一投稿
          const candidates =
            item.image_versions2?.candidates ?? [];
          if (candidates.length > 0) {
            const best = candidates.reduce(
              (a: { width: number }, b: { width: number }) =>
                a.width > b.width ? a : b
            );
            imageUrls.push(best.url);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to parse embedded JSON:", e);
  }

  // 戦略2: __additionalDataLoaded パターン
  if (imageUrls.length === 0) {
    try {
      const addDataMatch = html.match(
        /window\.__additionalDataLoaded\s*\(\s*['"][^'"]*['"]\s*,\s*(\{.+?\})\s*\)/
      );
      if (addDataMatch) {
        const data = JSON.parse(addDataMatch[1]);
        const media =
          data?.graphql?.shortcode_media ??
          data?.items?.[0] ??
          null;
        if (media) {
          extractMediaUrls(media, imageUrls);
        }
      }
    } catch (e) {
      console.warn("Failed to parse __additionalDataLoaded:", e);
    }
  }

  // 戦略3: display_url / display_resources パターン
  if (imageUrls.length === 0) {
    try {
      // display_url パターンで全画像を抽出
      const displayUrlRegex = /"display_url"\s*:\s*"(https?:[^"]+)"/g;
      let match;
      const seen = new Set<string>();
      while ((match = displayUrlRegex.exec(html)) !== null) {
        const imgUrl = match[1].replace(/\\u0026/g, "&").replace(/\\/g, "");
        if (!seen.has(imgUrl)) {
          seen.add(imgUrl);
          imageUrls.push(imgUrl);
        }
      }
    } catch (e) {
      console.warn("Failed to extract display_url:", e);
    }
  }

  // 戦略4: OG image をフォールバック
  if (imageUrls.length === 0 && ogImage) {
    imageUrls.push(decodeHtml(ogImage));
  }

  return { text, imageUrls, author };
}

// GraphQL レスポンスからメディアURLを抽出
function extractMediaUrls(
  media: Record<string, unknown>,
  urls: string[]
): void {
  // カルーセル
  const edges = (
    media.edge_sidecar_to_children as {
      edges?: { node: Record<string, unknown> }[];
    }
  )?.edges;
  if (edges && edges.length > 0) {
    for (const edge of edges) {
      const node = edge.node;
      const displayUrl = node.display_url as string;
      if (displayUrl) urls.push(displayUrl);
    }
    return;
  }
  // 単一
  const displayUrl = media.display_url as string;
  if (displayUrl) urls.push(displayUrl);
}

// oEmbed API（テキスト・author取得のフォールバック）
async function fetchOEmbedInfo(url: string): Promise<{
  text: string;
  author: string;
}> {
  const appId = process.env.INSTAGRAM_APP_ID || process.env.FACEBOOK_APP_ID;
  const appSecret =
    process.env.INSTAGRAM_APP_SECRET || process.env.FACEBOOK_APP_SECRET;

  let oembedUrl: string;
  if (appId && appSecret) {
    oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${appId}|${appSecret}`;
  } else {
    oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&omitscript=true`;
  }

  const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`oEmbed error: ${res.status}`);

  const data = await res.json();
  return {
    text: data.title || "",
    author: data.author_name || "",
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
        {
          error:
            "インポート制限に達しました。しばらくしてからお試しください",
        },
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

    // Instagram ページから全画像を取得
    let text = "";
    let author = "";
    let imageUrls: string[] = [];

    try {
      const pageData = await fetchFromInstagramPage(shortcode);
      text = pageData.text;
      author = pageData.author;
      imageUrls = pageData.imageUrls;
    } catch (e) {
      console.error("Instagram page fetch failed:", e);
    }

    // テキスト・authorが取得できなかった場合、oEmbedで補完
    if (!text || !author) {
      try {
        const oembed = await fetchOEmbedInfo(canonicalUrl);
        if (!text) text = oembed.text;
        if (!author) author = oembed.author;
      } catch (e) {
        console.warn("oEmbed fallback failed:", e);
      }
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "この投稿から画像を取得できませんでした。投稿が公開設定か確認してください" },
        { status: 400 }
      );
    }

    // 画像をダウンロード → WebP変換 → Vercel Blob に保存
    // Instagram画像はアスペクト比を維持（リサイズしない）
    const savedUrls: string[] = [];
    for (const imageUrl of imageUrls) {
      let buffer: Buffer;
      try {
        const imgRes = await fetch(imageUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Referer: "https://www.instagram.com/",
          },
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

      // WebP変換（Instagram原寸を維持、リサイズなし）
      let processed;
      try {
        const uuid = randomUUID();
        processed = await processImageToWebP(buffer, uuid, {
          maxWidth: 4096,
          quality: 90,
        });
      } catch (e) {
        console.error("WebP conversion error:", e);
        savedUrls.push(imageUrl);
        continue;
      }

      try {
        const blob = await put(
          `panels/${processed.filename}`,
          processed.buffer,
          { access: "public", contentType: "image/webp" }
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
