// Instagram公式連携（Instagram API with Instagram Login）
// 匿名スクレイピングの代替。作家本人がIGを連携し、本人のメディアを正規に取得する。

const APP_ID = process.env.INSTAGRAM_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://komapara.com";
const REDIRECT_URI = `${BASE}/api/instagram/callback`;
const SCOPE = "instagram_business_basic";

export function isInstagramConfigured(): boolean {
  return !!(APP_ID && APP_SECRET);
}

export function buildAuthUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: APP_ID ?? "",
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${p.toString()}`;
}

// 認可コード → 短期トークン（＋igユーザーID）
export async function exchangeCode(
  code: string
): Promise<{ accessToken: string; userId: string } | null> {
  const body = new URLSearchParams({
    client_id: APP_ID ?? "",
    client_secret: APP_SECRET ?? "",
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
    code,
  });
  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const d = await res.json();
  if (!d?.access_token) return null;
  return { accessToken: d.access_token, userId: String(d.user_id) };
}

// 短期トークン → 長期トークン（60日）
export async function toLongLivedToken(
  shortToken: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const p = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: APP_SECRET ?? "",
    access_token: shortToken,
  });
  const res = await fetch(`https://graph.instagram.com/access_token?${p.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const d = await res.json();
  if (!d?.access_token) return null;
  return { accessToken: d.access_token, expiresIn: d.expires_in ?? 5184000 };
}

// 長期トークンの更新（24h以上経過〜期限前）
export async function refreshLongLivedToken(
  token: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  const p = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: token });
  const res = await fetch(`https://graph.instagram.com/refresh_access_token?${p.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const d = await res.json();
  if (!d?.access_token) return null;
  return { accessToken: d.access_token, expiresIn: d.expires_in ?? 5184000 };
}

export async function getProfile(
  token: string
): Promise<{ id: string; username?: string } | null> {
  const p = new URLSearchParams({ fields: "id,username", access_token: token });
  const res = await fetch(`https://graph.instagram.com/me?${p.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  return res.json();
}

export type IgMedia = {
  id: string;
  caption?: string;
  media_type: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  children?: { data: { id: string; media_type: string; media_url?: string }[] };
};

// 本人のメディア一覧（カルーセルは children 展開）
export async function getMedia(token: string, limit = 24): Promise<IgMedia[]> {
  const fields =
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{id,media_type,media_url}";
  const p = new URLSearchParams({ fields, access_token: token, limit: String(limit) });
  const res = await fetch(`https://graph.instagram.com/me/media?${p.toString()}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const d = await res.json();
  return d?.data ?? [];
}

// 1件のメディア → 画像URL配列（4コマ＝カルーセル全コマ / 単一画像）。動画は除外
export function imageUrlsFromMedia(m: IgMedia): string[] {
  if (m.media_type === "CAROUSEL_ALBUM" && m.children?.data) {
    return m.children.data
      .filter((c) => c.media_type === "IMAGE" && c.media_url)
      .map((c) => c.media_url as string);
  }
  if (m.media_type === "IMAGE" && m.media_url) return [m.media_url];
  return [];
}
