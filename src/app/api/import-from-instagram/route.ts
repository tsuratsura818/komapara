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
// 正方形でない候補（元のアスペクト比を保持）を優先
function getBestCandidate(
  candidates: { url: string; width: number; height?: number }[]
): string | null {
  if (!candidates || candidates.length === 0) return null;

  // 正方形でない候補をフィルタ（height情報がある場合）
  const nonSquare = candidates.filter((c) => c.height && c.width !== c.height);
  const pool = nonSquare.length > 0 ? nonSquare : candidates;

  return pool.reduce((a, b) => (a.width > b.width ? a : b)).url;
}

// ============================================================
// JSON 抽出ヘルパー（括弧マッチング方式）
// ============================================================

// 開始位置から対応する閉じ括弧までのJSON文字列を抽出
function extractJsonAt(str: string, startIdx: number): string | null {
  const ch = str[startIdx];
  if (ch !== "{" && ch !== "[") return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  const limit = Math.min(str.length, startIdx + 500_000);
  for (let i = startIdx; i < limit; i++) {
    const c = str[i];
    if (esc) { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return str.substring(startIdx, i + 1);
    }
  }
  return null;
}

// "key": の後にあるJSONオブジェクトを抽出
function extractJsonAfterKey(str: string, key: string, fromIdx = 0): string | null {
  const keyPattern = `"${key}"`;
  const idx = str.indexOf(keyPattern, fromIdx);
  if (idx === -1) return null;
  // "key" の後に : を探す
  let pos = idx + keyPattern.length;
  while (pos < str.length && str[pos] !== ":") pos++;
  if (pos >= str.length) return null;
  pos++; // skip :
  // 空白スキップ
  while (pos < str.length && /\s/.test(str[pos])) pos++;
  if (str[pos] === "{" || str[pos] === "[") {
    return extractJsonAt(str, pos);
  }
  return null;
}

// ============================================================
// メディアデータ抽出
// ============================================================

// Instagram CDN URLからクロップ・リサイズパラメータを除去してオリジナル画像URLを取得
function removeInstagramCrop(url: string): string {
  try {
    const u = new URL(url);

    // 1) パス内のクロップ・サイズ指定を除去
    u.pathname = u.pathname
      .replace(/\/c[\d.]+a?\//g, "/")
      .replace(/\/s\d+x\d+\//g, "/")
      .replace(/\/p\d+x\d+\//g, "/");

    // 2) stp クエリパラメータ内のクロップ・サイズ指定を除去
    //    例: stp=dst-jpg_e35_s1080x1080_cr0.0.1080.1080
    //    例: stp=c0.0.1080.1080.dst-jpg_e35_s1080x1080
    const stp = u.searchParams.get("stp");
    if (stp) {
      const cleaned = stp
        .replace(/^c[\d.]+\./, "")       // 先頭 c0.0.1080.1080. (crop prefix)
        .replace(/_cr[\d.]+/g, "")       // _cr0.0.1080.1080 (crop)
        .replace(/_[sp]\d+x\d+/g, "")   // _s1080x1080 / _p1080x1080 (size)
        .replace(/^[sp]\d+x\d+_?/, "")  // 先頭 s1080x1080 (size prefix)
        .replace(/__+/g, "_")
        .replace(/^_|_$/g, "");
      if (cleaned) {
        u.searchParams.set("stp", cleaned);
      } else {
        u.searchParams.delete("stp");
      }
    }

    return u.toString();
  } catch {
    return url;
  }
}

// GraphQLノードから最良の画像URLを取得
// 優先順位: image_versions2.candidates（未クロップ） > display_url > display_resources（クロップ済みの場合あり）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBestGraphQLImageUrl(node: any): string | null {
  // 1) image_versions2.candidates（未クロップのオリジナル比率）を最優先
  const candidates = node?.image_versions2?.candidates;
  if (candidates && Array.isArray(candidates) && candidates.length > 0) {
    const best = getBestCandidate(candidates);
    if (best) return best;
  }

  // 2) display_url（display_resourcesより未クロップの可能性が高い）
  if (node?.display_url) return node.display_url;

  // 3) display_resources（正方形クロップ済みの場合あり）
  const resources = node?.display_resources;
  if (resources && Array.isArray(resources) && resources.length > 0) {
    const best = resources.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) => ((a.config_width ?? 0) > (b.config_width ?? 0) ? a : b)
    );
    if (best.src) return best.src;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractGraphQLMedia(media: any): FetchResult | null {
  if (!media) return null;
  const imageUrls: string[] = [];

  // カルーセル（複数画像）
  const edges = media.edge_sidecar_to_children?.edges;
  if (edges && edges.length > 0) {
    for (const edge of edges) {
      const url = getBestGraphQLImageUrl(edge.node);
      if (url) imageUrls.push(url);
    }
  } else {
    const url = getBestGraphQLImageUrl(media);
    if (url) imageUrls.push(url);
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
      // original_width/original_height がある場合、元のアスペクト比に一致する候補を優先
      const origW = cm.original_width;
      const origH = cm.original_height;
      if (origW && origH && origW !== origH) {
        const origRatio = origW / origH;
        const matching = candidates.filter((c: { width: number; height?: number }) =>
          c.height && Math.abs(c.width / c.height - origRatio) < 0.05
        );
        if (matching.length > 0) {
          const best = getBestCandidate(matching);
          if (best) { imageUrls.push(best); continue; }
        }
      }
      const best = getBestCandidate(candidates);
      if (best) imageUrls.push(best);
    }
  } else if (item.image_versions2?.candidates) {
    const candidates = item.image_versions2.candidates;
    const origW = item.original_width;
    const origH = item.original_height;
    if (origW && origH && origW !== origH) {
      const origRatio = origW / origH;
      const matching = candidates.filter((c: { width: number; height?: number }) =>
        c.height && Math.abs(c.width / c.height - origRatio) < 0.05
      );
      if (matching.length > 0) {
        const best = getBestCandidate(matching);
        if (best) { imageUrls.push(best); }
      }
    }
    if (imageUrls.length === 0) {
      const best = getBestCandidate(candidates);
      if (best) imageUrls.push(best);
    }
  }

  if (imageUrls.length === 0 && item.display_url) {
    imageUrls.push(item.display_url);
  }

  const caption = item.caption?.text ??
    item.edge_media_to_caption?.edges?.[0]?.node?.text ?? "";
  const author = item.user?.username ?? item.owner?.username ?? "";

  return imageUrls.length > 0 ? { text: caption, imageUrls, author } : null;
}

// ============================================================
// HTML深層スキャン: shortcode_media JSONを括弧マッチで抽出
// ============================================================
function deepScanForMedia(html: string, shortcode: string): FetchResult | null {
  // パターン1: "shortcode_media" キーを探す
  const keys = ["shortcode_media", "xdt_shortcode_media"];
  for (const key of keys) {
    let fromIdx = 0;
    while (true) {
      const jsonStr = extractJsonAfterKey(html, key, fromIdx);
      if (!jsonStr) break;
      fromIdx = html.indexOf(`"${key}"`, fromIdx) + key.length + 2;

      try {
        const media = JSON.parse(jsonStr);
        // ターゲット投稿のshortcodeと一致するか確認
        if (media.shortcode && media.shortcode !== shortcode) continue;

        const result = media.edge_sidecar_to_children
          ? extractGraphQLMedia(media)
          : extractItemsMedia(media);
        if (result && result.imageUrls.length > 1) return result;
      } catch { /* JSONパース失敗は無視 */ }
    }
  }

  // パターン2: "items" 配列内の carousel_media を探す
  let itemsIdx = 0;
  while (true) {
    const itemsStr = extractJsonAfterKey(html, "items", itemsIdx);
    if (!itemsStr || !itemsStr.startsWith("[")) break;
    itemsIdx = html.indexOf('"items"', itemsIdx) + 7;

    try {
      const items = JSON.parse(itemsStr);
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        // shortcode/codeが一致するか確認
        const code = item.code ?? item.shortcode;
        if (code && code !== shortcode) continue;

        const result = extractItemsMedia(item);
        if (result && result.imageUrls.length > 1) return result;
      }
    } catch { /* ignore */ }
  }

  return null;
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
  const docIds = [
    "8845758582119845",
    "17888483320059182",
    "9496378587088351",
    "7511350078897498",
    "25531498899829322",
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

      const media =
        json?.data?.shortcode_media ??
        json?.data?.xdt_shortcode_media ??
        json?.data?.xdt_api__v1__media__shortcode__web_info?.items?.[0];

      if (!media) continue;

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
          "Instagram 317.0.0.34.109 Android (34/14; 420dpi; 1080x2400; samsung; SM-S928B; e3q; qcom; ja_JP; 580250901)",
        Accept: "*/*",
        "X-IG-App-ID": "567067343352427",
        "X-IG-Capabilities": "3brTvw8=",
        "X-IG-Connection-Type": "WIFI",
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
// 戦略5: embed ページからスクレイピング（括弧マッチング方式）
// ============================================================
async function fetchViaEmbed(shortcode: string): Promise<FetchResult | null> {
  const embedUrls = [
    `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
    `https://www.instagram.com/p/${shortcode}/embed/`,
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

      // 1) window.__additionalDataLoaded パターン（括弧マッチ方式）
      const addDataIdx = html.indexOf("window.__additionalDataLoaded");
      if (addDataIdx !== -1) {
        // 第2引数のJSON objectを見つける
        const commaIdx = html.indexOf(",", addDataIdx);
        if (commaIdx !== -1) {
          let pos = commaIdx + 1;
          while (pos < html.length && html[pos] !== "{") pos++;
          if (html[pos] === "{") {
            const jsonStr = extractJsonAt(html, pos);
            if (jsonStr) {
              try {
                const data = JSON.parse(jsonStr);
                const media = data?.shortcode_media ?? data?.graphql?.shortcode_media;
                const result = extractGraphQLMedia(media);
                if (result && result.imageUrls.length > 1) return result;
              } catch { /* ignore */ }
            }
          }
        }
      }

      // 2) gql_data パターン（括弧マッチ方式）
      const gqlJsonStr = extractJsonAfterKey(html, "gql_data");
      if (gqlJsonStr) {
        try {
          const data = JSON.parse(gqlJsonStr);
          const result = extractGraphQLMedia(data?.shortcode_media);
          if (result && result.imageUrls.length > 1) return result;
        } catch { /* ignore */ }
      }

      // 3) HTML全体を深層スキャン（shortcode_media / items を括弧マッチで探索）
      const deepResult = deepScanForMedia(html, shortcode);
      if (deepResult && deepResult.imageUrls.length > 1) return deepResult;

      // 4) 単一画像フォールバック（EmbeddedMediaImage）
      const mainImgMatch = html.match(
        /<img[^>]+class="[^"]*EmbeddedMediaImage[^"]*"[^>]+src="([^"]+)"/
      );
      if (mainImgMatch) {
        const imgUrl = unescapeUrl(mainImgMatch[1]);
        const captionMatch = html.match(
          /<div\s+class="[^"]*Caption[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/
        );
        const text = captionMatch
          ? captionMatch[1].replace(/<[^>]+>/g, "").trim()
          : "";
        return { text, imageUrls: [imgUrl], author: "" };
      }
    } catch (e) {
      console.warn(`[IG] Embed fetch failed (${embedUrl}):`, e);
    }
  }
  return null;
}

// ============================================================
// 戦略6: 通常ページ（Googlebot UA）+ 深層スキャン
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

    // 1) 深層スキャン（shortcode_media / items JSONを括弧マッチで検索）
    const deepResult = deepScanForMedia(html, shortcode);
    if (deepResult && deepResult.imageUrls.length > 1) return deepResult;

    // 2) <script type="application/ld+json"> から画像取得
    const imageUrls: string[] = [];
    const seen = new Set<string>();
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

    // 3) OGイメージ（フォールバック）
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
// 戦略7: ブラウザUA + 深層スキャン（Googlebotとは異なるレスポンスを期待）
// ============================================================
async function fetchViaBrowserPage(shortcode: string): Promise<FetchResult | null> {
  try {
    const url = `https://www.instagram.com/p/${shortcode}/`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;
    const html = await res.text();

    // 深層スキャン
    const deepResult = deepScanForMedia(html, shortcode);
    if (deepResult) return deepResult;

    // OGイメージフォールバック
    const ogImage = html.match(
      /<meta\s+(?:property|name)="og:image"\s+content="([^"]*?)"/
    )?.[1];
    if (ogImage) {
      const ogDesc = html.match(
        /<meta\s+(?:property|name)="og:description"\s+content="([^"]*?)"/
      )?.[1];
      return {
        text: ogDesc ? unescapeUrl(ogDesc) : "",
        imageUrls: [unescapeUrl(ogImage)],
        author: "",
      };
    }

    return null;
  } catch (e) {
    console.warn("[IG] Browser page failed:", e);
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

    const { success } = await rateLimit(`import-ig:${session.user.id}`, {
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
    // Mobile APIを優先: image_versions2.candidatesで未クロップ画像を取得できる
    type Strategy = { name: string; fn: () => Promise<FetchResult | null> };
    const strategies: Strategy[] = [
      { name: "Mobile API", fn: () => fetchViaMobileApi(shortcode) },
      { name: "GraphQL POST", fn: () => fetchViaGraphQLPost(shortcode) },
      { name: "GraphQL GET", fn: () => fetchViaGraphQL(shortcode) },
      { name: "JSON API", fn: () => fetchViaJsonApi(shortcode) },
      { name: "Embed", fn: () => fetchViaEmbed(shortcode) },
      { name: "Page Scraping", fn: () => fetchViaPageScraping(shortcode) },
      { name: "Browser Page", fn: () => fetchViaBrowserPage(shortcode) },
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
      let buffer!: Buffer;
      try {
        // クロップ除去URLを優先し、失敗時はオリジナルURLにフォールバック
        const uncroppedUrl = removeInstagramCrop(imageUrl);
        const urlsToTry = uncroppedUrl !== imageUrl
          ? [uncroppedUrl, imageUrl]
          : [imageUrl];

        let downloaded = false;
        for (const tryUrl of urlsToTry) {
          const imgRes = await fetch(tryUrl, {
            headers: {
              "User-Agent": BROWSER_UA,
              Referer: "https://www.instagram.com/",
            },
            signal: AbortSignal.timeout(15000),
          });
          if (imgRes.ok) {
            buffer = Buffer.from(await imgRes.arrayBuffer());
            downloaded = true;
            console.log(`[IG] Downloaded: ${tryUrl.slice(0, 120)}... (${buffer.length} bytes)`);
            break;
          } else {
            console.warn(`[IG] Download failed (${imgRes.status}): ${tryUrl.slice(0, 120)}`);
          }
        }
        if (!downloaded) {
          console.error(`[IG] Image download failed for ${imageUrl.slice(0, 80)}`);
          continue;
        }
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
