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

function unescapeUrl(s: string): string {
  return s
    .replace(/\\u0026/g, "&")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\\/g, "");
}

type FetchResult = {
  text: string;
  imageUrls: string[];
  author: string;
};

// shortcode → media_pk（数値ID）変換
function shortcodeToMediaPk(shortcode: string): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = BigInt(0);
  for (const char of shortcode) {
    id = id * BigInt(64) + BigInt(alphabet.indexOf(char));
  }
  return id.toString();
}

// candidates 配列から最高解像度の画像URLを取得
function getBestCandidate(
  candidates: { url: string; width: number }[]
): string | null {
  if (!candidates || candidates.length === 0) return null;
  return candidates.reduce((a, b) => (a.width > b.width ? a : b)).url;
}

// ============================================================
// 戦略1: Instagram GraphQL API（公開投稿の詳細データを返す）
// ============================================================
async function fetchViaGraphQL(shortcode: string): Promise<FetchResult | null> {
  try {
    const variables = JSON.stringify({ shortcode });
    // Instagram公開GraphQLエンドポイント
    const url = `https://www.instagram.com/graphql/query/?query_hash=b3055c01b4b222b8a47dc12b090e4e64&variables=${encodeURIComponent(variables)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const media = json?.data?.shortcode_media;
    if (!media) return null;

    const imageUrls: string[] = [];

    // カルーセル（複数画像）
    const edges = media.edge_sidecar_to_children?.edges;
    if (edges && edges.length > 0) {
      for (const edge of edges) {
        const node = edge.node;
        if (node.display_url) imageUrls.push(node.display_url);
      }
    } else if (media.display_url) {
      // 単一画像
      imageUrls.push(media.display_url);
    }

    const caption =
      media.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
    const author = media.owner?.username ?? "";

    return { text: caption, imageUrls, author };
  } catch (e) {
    console.warn("[IG] GraphQL failed:", e);
    return null;
  }
}

// ============================================================
// 戦略2: Instagram Mobile API（i.instagram.com）
// ============================================================
async function fetchViaMobileApi(shortcode: string): Promise<FetchResult | null> {
  try {
    const mediaPk = shortcodeToMediaPk(shortcode);
    const url = `https://i.instagram.com/api/v1/media/${mediaPk}/info/`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)",
        Accept: "*/*",
        "X-IG-App-ID": "936619743392459",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const item = json?.items?.[0];
    if (!item) return null;

    const imageUrls: string[] = [];

    // カルーセル（複数画像）
    if (item.carousel_media && item.carousel_media.length > 0) {
      for (const cm of item.carousel_media) {
        const candidates = cm.image_versions2?.candidates ?? [];
        const best = getBestCandidate(candidates);
        if (best) imageUrls.push(best);
      }
    }
    // 単一画像
    else if (item.image_versions2?.candidates) {
      const best = getBestCandidate(item.image_versions2.candidates);
      if (best) imageUrls.push(best);
    }

    const caption = item.caption?.text ?? "";
    const author = item.user?.username ?? "";

    return imageUrls.length > 0 ? { text: caption, imageUrls, author } : null;
  } catch (e) {
    console.warn("[IG] Mobile API failed:", e);
    return null;
  }
}

// ============================================================
// 戦略3: Instagram ?__a=1 JSON API
// ============================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFromItemsFormat(media: any): string[] {
  const imageUrls: string[] = [];
  if (media.carousel_media) {
    for (const cm of media.carousel_media) {
      const candidates = cm.image_versions2?.candidates ?? [];
      const best = getBestCandidate(candidates);
      if (best) imageUrls.push(best);
    }
  } else if (media.image_versions2?.candidates?.length > 0) {
    const best = getBestCandidate(media.image_versions2.candidates);
    if (best) imageUrls.push(best);
  }
  return imageUrls;
}

async function fetchViaJsonApi(shortcode: string): Promise<FetchResult | null> {
  try {
    const url = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) return null;

    const json = await res.json();

    // graphql 形式
    const media = json?.graphql?.shortcode_media ?? json?.items?.[0];
    if (!media) return null;

    let imageUrls: string[] = [];

    // graphql 形式のカルーセル
    const edges = media.edge_sidecar_to_children?.edges;
    if (edges && edges.length > 0) {
      for (const edge of edges) {
        if (edge.node?.display_url) imageUrls.push(edge.node.display_url);
      }
    }
    // items 形式のカルーセル / 単一画像
    else {
      imageUrls = extractFromItemsFormat(media);
    }
    // display_url フォールバック
    if (imageUrls.length === 0 && media.display_url) {
      imageUrls.push(media.display_url);
    }

    const caption =
      media.edge_media_to_caption?.edges?.[0]?.node?.text ??
      media.caption?.text ??
      "";
    const author = media.owner?.username ?? media.user?.username ?? "";

    return imageUrls.length > 0 ? { text: caption, imageUrls, author } : null;
  } catch (e) {
    console.warn("[IG] JSON API failed:", e);
    return null;
  }
}

// ============================================================
// 戦略4: embed ページからスクレイピング
// ============================================================
async function fetchViaEmbed(shortcode: string): Promise<FetchResult | null> {
  try {
    const url = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const imageUrls: string[] = [];

    // embed ページ内のJSONデータを探す
    // window.__additionalDataLoaded パターン
    const addDataMatch = html.match(
      /window\.__additionalDataLoaded\s*\(\s*['"][^'"]*['"]\s*,\s*({.+?})\s*\)/
    );
    if (addDataMatch) {
      try {
        const data = JSON.parse(addDataMatch[1]);
        const media = data?.shortcode_media ?? data?.graphql?.shortcode_media;
        if (media) {
          const edges = media.edge_sidecar_to_children?.edges;
          if (edges?.length > 0) {
            for (const edge of edges) {
              if (edge.node?.display_url) imageUrls.push(edge.node.display_url);
            }
          } else if (media.display_url) {
            imageUrls.push(media.display_url);
          }
          const caption =
            media.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
          const author = media.owner?.username ?? "";
          if (imageUrls.length > 0) {
            return { text: caption, imageUrls, author };
          }
        }
      } catch {
        // JSON parse failed
      }
    }

    // display_url パターン（カルーセル全画像を含むことが多い）
    const seen = new Set<string>();
    let match;
    const displayRegex = /"display_url"\s*:\s*"(https?:[^"]+)"/g;
    while ((match = displayRegex.exec(html)) !== null) {
      const imgUrl = unescapeUrl(match[1]);
      if (!seen.has(imgUrl)) {
        seen.add(imgUrl);
        imageUrls.push(imgUrl);
      }
    }

    // display_resources パターン（高解像度版を取得）
    if (imageUrls.length === 0) {
      const resourceRegex = /"display_resources"\s*:\s*\[([^\]]+)\]/g;
      while ((match = resourceRegex.exec(html)) !== null) {
        const srcMatch = match[1].match(/"src"\s*:\s*"(https?:[^"]+)"/g);
        if (srcMatch) {
          // 最後のsrc（最高解像度）を取得
          const last = srcMatch[srcMatch.length - 1];
          const urlMatch = last.match(/"src"\s*:\s*"(https?:[^"]+)"/);
          if (urlMatch) {
            const imgUrl = unescapeUrl(urlMatch[1]);
            if (!seen.has(imgUrl)) {
              seen.add(imgUrl);
              imageUrls.push(imgUrl);
            }
          }
        }
      }
    }

    // embed ページの <img> タグから画像URLを抽出
    if (imageUrls.length === 0) {
      const imgRegex =
        /<img[^>]+(?:class="[^"]*EmbeddedMedia[^"]*"|data-src)[^>]*\s+src="([^"]+)"/g;
      while ((match = imgRegex.exec(html)) !== null) {
        const imgUrl = unescapeUrl(match[1]);
        if (imgUrl.includes("instagram") || imgUrl.includes("cdninstagram") || imgUrl.includes("fbcdn")) {
          if (!seen.has(imgUrl)) {
            seen.add(imgUrl);
            imageUrls.push(imgUrl);
          }
        }
      }
    }

    // 汎用 img src パターン（Instagram CDN の画像のみ）
    if (imageUrls.length === 0) {
      const genericImgRegex = /src="(https:\/\/[^"]*(?:cdninstagram|fbcdn)[^"]*\.(?:jpg|webp)[^"]*)"/g;
      while ((match = genericImgRegex.exec(html)) !== null) {
        const imgUrl = unescapeUrl(match[1]);
        if (!seen.has(imgUrl)) {
          seen.add(imgUrl);
          imageUrls.push(imgUrl);
        }
      }
    }

    // キャプション取得
    const captionMatch = html.match(
      /<div\s+class="[^"]*Caption[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/
    );
    const text = captionMatch
      ? captionMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    return imageUrls.length > 0
      ? { text, imageUrls, author: "" }
      : null;
  } catch (e) {
    console.warn("[IG] Embed fetch failed:", e);
    return null;
  }
}

// ============================================================
// 戦略5: 通常ページの OG タグ（フォールバック、1枚のみ）
// ============================================================
async function fetchViaOgTags(shortcode: string): Promise<FetchResult | null> {
  try {
    const url = `https://www.instagram.com/p/${shortcode}/`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    const ogImage = html.match(
      /<meta\s+(?:property|name)="og:image"\s+content="([^"]*?)"/
    )?.[1];
    const ogDesc = html.match(
      /<meta\s+(?:property|name)="og:description"\s+content="([^"]*?)"/
    )?.[1];
    const ogTitle = html.match(
      /<meta\s+(?:property|name)="og:title"\s+content="([^"]*?)"/
    )?.[1];

    if (!ogImage) return null;

    let author = "";
    if (ogTitle) {
      const m =
        ogTitle.match(/^(.+?)(?:\s+on\s+Instagram|\s*はInstagram)/) ??
        ogTitle.match(/^@?([^:–—\-]+)/);
      if (m) author = m[1].replace(/^@/, "").trim();
    }

    return {
      text: ogDesc ? unescapeUrl(ogDesc) : "",
      imageUrls: [unescapeUrl(ogImage)],
      author,
    };
  } catch (e) {
    console.warn("[IG] OG tags fetch failed:", e);
    return null;
  }
}

// ============================================================
// oEmbed（テキスト・author 補完用）
// ============================================================
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
  return { text: data.title || "", author: data.author_name || "" };
}

// ============================================================
// メインハンドラ
// ============================================================
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

    // 順番に試す: GraphQL → Mobile API → JSON API → Embed → OG tags
    let result: FetchResult | null = null;

    result = await fetchViaGraphQL(shortcode);
    console.log(`[IG] GraphQL: ${result ? result.imageUrls.length + " images" : "failed"}`);

    if (!result || result.imageUrls.length === 0) {
      result = await fetchViaMobileApi(shortcode);
      console.log(`[IG] Mobile API: ${result ? result.imageUrls.length + " images" : "failed"}`);
    }

    if (!result || result.imageUrls.length === 0) {
      result = await fetchViaJsonApi(shortcode);
      console.log(`[IG] JSON API: ${result ? result.imageUrls.length + " images" : "failed"}`);
    }

    if (!result || result.imageUrls.length === 0) {
      result = await fetchViaEmbed(shortcode);
      console.log(`[IG] Embed: ${result ? result.imageUrls.length + " images" : "failed"}`);
    }

    if (!result || result.imageUrls.length === 0) {
      result = await fetchViaOgTags(shortcode);
      console.log(`[IG] OG tags: ${result ? result.imageUrls.length + " images" : "failed"}`);
    }

    // テキスト・author を oEmbed で補完
    if (result && (!result.text || !result.author)) {
      try {
        const oembed = await fetchOEmbedInfo(canonicalUrl);
        if (!result.text) result.text = oembed.text;
        if (!result.author) result.author = oembed.author;
      } catch {
        // ignore
      }
    }

    if (!result || result.imageUrls.length === 0) {
      return NextResponse.json(
        { error: "この投稿から画像を取得できませんでした。投稿が公開設定か確認してください" },
        { status: 400 }
      );
    }

    // 画像をダウンロード → WebP変換 → Vercel Blob に保存
    const savedUrls: string[] = [];
    for (const imageUrl of result.imageUrls) {
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
          console.error(`[IG] Image download failed: ${imgRes.status}`);
          continue;
        }
        buffer = Buffer.from(await imgRes.arrayBuffer());
      } catch (e) {
        console.error("[IG] Image download error:", e);
        continue;
      }

      let processed;
      try {
        const uuid = randomUUID();
        processed = await processImageToWebP(buffer, uuid);
      } catch (e) {
        console.error("[IG] WebP conversion error:", e);
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
        console.error("[IG] Blob upload error:", e);
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
      text: result.text,
      author: result.author,
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
