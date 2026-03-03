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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGraphQLMedia(media: any): FetchResult | null {
  if (!media) return null;
  const imageUrls: string[] = [];

  // カルーセル（複数画像）
  const edges = media.edge_sidecar_to_children?.edges;
  if (edges && edges.length > 0) {
    for (const edge of edges) {
      const node = edge.node;
      if (node?.display_url) imageUrls.push(node.display_url);
    }
  } else if (media.display_url) {
    imageUrls.push(media.display_url);
  }

  const caption =
    media.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
  const author = media.owner?.username ?? "";

  return imageUrls.length > 0 ? { text: caption, imageUrls, author } : null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractItemsMedia(item: any): FetchResult | null {
  if (!item) return null;
  const imageUrls: string[] = [];

  if (item.carousel_media && item.carousel_media.length > 0) {
    for (const cm of item.carousel_media) {
      const candidates = cm.image_versions2?.candidates ?? [];
      const best = getBestCandidate(candidates);
      if (best) imageUrls.push(best);
    }
  } else if (item.image_versions2?.candidates) {
    const best = getBestCandidate(item.image_versions2.candidates);
    if (best) imageUrls.push(best);
  }

  if (imageUrls.length === 0 && item.display_url) {
    imageUrls.push(item.display_url);
  }

  const caption = item.caption?.text ??
    item.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
  const author = item.user?.username ?? item.owner?.username ?? "";

  return imageUrls.length > 0 ? { text: caption, imageUrls, author } : null;
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const IG_APP_ID = "936619743392459";

// ============================================================
// 戦略1: GraphQL GET（query_hash）
// ============================================================
async function fetchViaGraphQL(shortcode: string): Promise<FetchResult | null> {
  try {
    const variables = JSON.stringify({ shortcode });
    const url = `https://www.instagram.com/graphql/query/?query_hash=b3055c01b4b222b8a47dc12b090e4e64&variables=${encodeURIComponent(variables)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "application/json",
        "X-IG-App-ID": IG_APP_ID,
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return extractGraphQLMedia(json?.data?.shortcode_media);
  } catch (e) {
    console.warn("[IG] GraphQL GET failed:", e);
    return null;
  }
}

// ============================================================
// 戦略2: GraphQL POST（doc_id、Instagram最新Web形式）
// ============================================================
async function fetchViaGraphQLPost(shortcode: string): Promise<FetchResult | null> {
  // 複数のdoc_idを試す（Instagramが定期的に変更するため）
  const docIds = [
    "8845758582119845",
    "17888483320059182",
    "9496378587088351",
  ];

  for (const docId of docIds) {
    try {
      const variables = JSON.stringify({
        shortcode,
        child_comment_count: 0,
        fetch_comment_count: 0,
        parent_comment_count: 0,
        has_threaded_comments: false,
      });

      const res = await fetch("https://www.instagram.com/graphql/query/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": BROWSER_UA,
          "X-IG-App-ID": IG_APP_ID,
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
          "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
          Origin: "https://www.instagram.com",
          Referer: `https://www.instagram.com/p/${shortcode}/`,
        },
        body: `variables=${encodeURIComponent(variables)}&doc_id=${docId}`,
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("json")) continue;

      const json = await res.json();

      // レスポンス形式の解析（複数パターン対応）
      const media =
        json?.data?.shortcode_media ??
        json?.data?.xdt_shortcode_media ??
        json?.data?.xdt_api__v1__media__shortcode__web_info?.items?.[0];

      if (!media) continue;

      // GraphQL形式 or Items形式で抽出
      const result = media.edge_sidecar_to_children
        ? extractGraphQLMedia(media)
        : extractItemsMedia(media);

      if (result && result.imageUrls.length > 0) return result;
    } catch (e) {
      console.warn(`[IG] GraphQL POST (doc_id=${docId}) failed:`, e);
    }
  }
  return null;
}

// ============================================================
// 戦略3: Instagram Mobile API（i.instagram.com）
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
        "X-IG-App-ID": IG_APP_ID,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const json = await res.json();
    return extractItemsMedia(json?.items?.[0]);
  } catch (e) {
    console.warn("[IG] Mobile API failed:", e);
    return null;
  }
}

// ============================================================
// 戦略4: Instagram ?__a=1 JSON API
// ============================================================
async function fetchViaJsonApi(shortcode: string): Promise<FetchResult | null> {
  try {
    const url = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-IG-App-ID": IG_APP_ID,
        "X-Requested-With": "XMLHttpRequest",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) return null;

    const json = await res.json();
    const media = json?.graphql?.shortcode_media ?? json?.items?.[0];
    if (!media) return null;

    return media.edge_sidecar_to_children
      ? extractGraphQLMedia(media)
      : extractItemsMedia(media);
  } catch (e) {
    console.warn("[IG] JSON API failed:", e);
    return null;
  }
}

// ============================================================
// 戦略5: embed ページからスクレイピング
// ============================================================
async function fetchViaEmbed(shortcode: string): Promise<FetchResult | null> {
  // /embed/ と /embed/captioned/ の両方を試す
  const embedUrls = [
    `https://www.instagram.com/p/${shortcode}/embed/`,
    `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
  ];

  for (const embedUrl of embedUrls) {
    try {
      const res = await fetch(embedUrl, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "text/html",
          "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;
      const html = await res.text();
      const imageUrls: string[] = [];
      const seen = new Set<string>();

      // 1) window.__additionalDataLoaded パターン
      const addDataMatch = html.match(
        /window\.__additionalDataLoaded\s*\(\s*['"][^'"]*['"]\s*,\s*({.+?})\s*\)/
      );
      if (addDataMatch) {
        try {
          const data = JSON.parse(addDataMatch[1]);
          const media = data?.shortcode_media ?? data?.graphql?.shortcode_media;
          const result = extractGraphQLMedia(media);
          if (result && result.imageUrls.length > 1) return result;
          if (result) {
            for (const u of result.imageUrls) {
              if (!seen.has(u)) { seen.add(u); imageUrls.push(u); }
            }
          }
        } catch { /* ignore */ }
      }

      // 2) gql_data パターン（新しいembed形式）
      const gqlMatch = html.match(/"gql_data"\s*:\s*({[\s\S]*?"shortcode_media"[\s\S]*?})\s*[,}]/);
      if (gqlMatch) {
        try {
          const data = JSON.parse(gqlMatch[1]);
          const result = extractGraphQLMedia(data?.shortcode_media);
          if (result && result.imageUrls.length > 1) return result;
          if (result) {
            for (const u of result.imageUrls) {
              if (!seen.has(u)) { seen.add(u); imageUrls.push(u); }
            }
          }
        } catch { /* ignore */ }
      }

      // 3) embedページの主画像（<img class="EmbeddedMediaImage">）を1枚だけ取得
      if (imageUrls.length === 0) {
        const mainImgMatch = html.match(
          /<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]+src="([^"]+)"/
        );
        if (mainImgMatch) {
          const imgUrl = unescapeUrl(mainImgMatch[1]);
          if (!seen.has(imgUrl)) {
            seen.add(imgUrl);
            imageUrls.push(imgUrl);
          }
        }
      }

      if (imageUrls.length > 0) {
        // キャプション取得
        const captionMatch = html.match(
          /<div\s+class="[^"]*Caption[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/
        );
        const text = captionMatch
          ? captionMatch[1].replace(/<[^>]+>/g, "").trim()
          : "";
        return { text, imageUrls, author: "" };
      }
    } catch (e) {
      console.warn(`[IG] Embed fetch failed (${embedUrl}):`, e);
    }
  }
  return null;
}

// ============================================================
// 戦略6: 通常ページからスクレイピング（Googlebotヘッダ）
// ============================================================
async function fetchViaPageScraping(shortcode: string): Promise<FetchResult | null> {
  try {
    const url = `https://www.instagram.com/p/${shortcode}/`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const html = await res.text();
    const imageUrls: string[] = [];
    const seen = new Set<string>();

    // 1) <script type="application/ld+json"> から画像取得（投稿固有の構造化データ）
    const ldJsonRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
    let ldMatch;
    while ((ldMatch = ldJsonRegex.exec(html)) !== null) {
      try {
        const ld = JSON.parse(ldMatch[1]);
        const images = ld.image ?? ld.contentUrl ?? ld.thumbnailUrl;
        if (Array.isArray(images)) {
          for (const img of images) {
            const u = typeof img === "string" ? img : img?.url;
            if (u && !seen.has(u)) { seen.add(u); imageUrls.push(u); }
          }
        } else if (typeof images === "string" && !seen.has(images)) {
          seen.add(images); imageUrls.push(images);
        }
      } catch { /* ignore */ }
    }

    // 2) OGイメージ（フォールバック）
    if (imageUrls.length === 0) {
      const ogImage = html.match(
        /<meta\s+(?:property|name)="og:image"\s+content="([^"]*?)"/
      )?.[1];
      if (ogImage) {
        const u = unescapeUrl(ogImage);
        if (!seen.has(u)) { seen.add(u); imageUrls.push(u); }
      }
    }

    if (imageUrls.length === 0) return null;

    // author / text
    const ogTitle = html.match(
      /<meta\s+(?:property|name)="og:title"\s+content="([^"]*?)"/
    )?.[1];
    const ogDesc = html.match(
      /<meta\s+(?:property|name)="og:description"\s+content="([^"]*?)"/
    )?.[1];

    let author = "";
    if (ogTitle) {
      const m =
        ogTitle.match(/^(.+?)(?:\s+on\s+Instagram|\s*はInstagram)/) ??
        ogTitle.match(/^@?([^:–—\-]+)/);
      if (m) author = m[1].replace(/^@/, "").trim();
    }

    return {
      text: ogDesc ? unescapeUrl(ogDesc) : "",
      imageUrls,
      author,
    };
  } catch (e) {
    console.warn("[IG] Page scraping failed:", e);
    return null;
  }
}

// ============================================================
// 戦略7: img_index を巡回して OG画像を1枚ずつ取得（最終フォールバック）
// ============================================================

// OGタグ抽出（property/content の順序が逆のパターンにも対応）
function extractOgTag(html: string, property: string): string | null {
  const p = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m1 = html.match(new RegExp(`<meta\\s+(?:property|name)="${p}"\\s+content="([^"]*?)"`, "i"));
  if (m1) return m1[1];
  const m2 = html.match(new RegExp(`<meta\\s+content="([^"]*?)"\\s+(?:property|name)="${p}"`, "i"));
  return m2 ? m2[1] : null;
}

async function fetchViaImgIndex(shortcode: string): Promise<FetchResult | null> {
  const imageUrls: string[] = [];
  const seen = new Set<string>();
  let text = "";
  let author = "";
  const MAX_INDEX = 16;

  for (let idx = 1; idx <= MAX_INDEX; idx++) {
    try {
      const url = `https://www.instagram.com/p/${shortcode}/?img_index=${idx}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) break;
      const html = await res.text();

      // ページが投稿ページか確認（ログインやフィードへのリダイレクトを除外）
      if (!html.includes(shortcode) && !html.includes("og:image")) {
        console.warn(`[IG] img_index=${idx}: page does not contain shortcode`);
        break;
      }

      const ogImage = extractOgTag(html, "og:image");
      if (!ogImage) break;

      const imgUrl = unescapeUrl(ogImage);

      // Instagram CDN画像でない場合はスキップ
      if (!imgUrl.includes("cdninstagram") && !imgUrl.includes("fbcdn")) {
        console.warn(`[IG] img_index=${idx}: og:image is not from Instagram CDN`);
        break;
      }

      // 同じ画像が返ってきたらカルーセル終端
      if (seen.has(imgUrl)) break;
      seen.add(imgUrl);
      imageUrls.push(imgUrl);

      // 1枚目でテキスト・author取得
      if (idx === 1) {
        const ogDesc = extractOgTag(html, "og:description");
        const ogTitle = extractOgTag(html, "og:title");
        text = ogDesc ? unescapeUrl(ogDesc) : "";
        if (ogTitle) {
          const m =
            ogTitle.match(/^(.+?)(?:\s+on\s+Instagram|\s*はInstagram)/) ??
            ogTitle.match(/^@?([^:–—\-]+)/);
          if (m) author = m[1].replace(/^@/, "").trim();
        }
      }
    } catch (e) {
      console.warn(`[IG] img_index=${idx} failed:`, e);
      break;
    }
  }

  console.log(`[IG] img_index: collected ${imageUrls.length} images`);
  return imageUrls.length > 0 ? { text, imageUrls, author } : null;
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

    // 戦略を順番に試す（2枚以上取れたら即終了）
    type Strategy = { name: string; fn: () => Promise<FetchResult | null> };
    const strategies: Strategy[] = [
      { name: "GraphQL GET", fn: () => fetchViaGraphQL(shortcode) },
      { name: "GraphQL POST", fn: () => fetchViaGraphQLPost(shortcode) },
      { name: "Mobile API", fn: () => fetchViaMobileApi(shortcode) },
      { name: "JSON API", fn: () => fetchViaJsonApi(shortcode) },
      { name: "Embed", fn: () => fetchViaEmbed(shortcode) },
      { name: "Page Scraping", fn: () => fetchViaPageScraping(shortcode) },
    ];

    let result: FetchResult | null = null;
    for (const strategy of strategies) {
      const r = await strategy.fn();
      const count = r?.imageUrls.length ?? 0;
      console.log(`[IG] ${strategy.name}: ${count > 0 ? count + " images" : "failed"}`);
      if (r && count > 1) {
        result = r;
        break;
      }
      // 1枚だけ取れた場合は保持しつつ次の戦略も試す
      if (r && count === 1 && !result) {
        result = r;
      }
    }

    // 1枚以下しか取れなかった場合、img_indexで巡回取得を試みる
    if (!result || result.imageUrls.length <= 1) {
      const imgIndexResult = await fetchViaImgIndex(shortcode);
      if (imgIndexResult && imgIndexResult.imageUrls.length > (result?.imageUrls.length ?? 0)) {
        result = imgIndexResult;
      }
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
            "User-Agent": BROWSER_UA,
            Referer: "https://www.instagram.com/",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (!imgRes.ok) {
          console.error(`[IG] Image download failed: ${imgRes.status} for ${imageUrl.slice(0, 80)}`);
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
        processed = await processImageToWebP(buffer, uuid, { trim: true });
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
