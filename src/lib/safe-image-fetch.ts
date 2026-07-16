import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * 外部画像を安全に取得するヘルパー（SSRF対策）。
 * - https のみ許可
 * - X / Instagram の公式CDNホストのみ許可（許可リスト）
 * - 解決先IPが private/loopback/link-local ならブロック（DNSリバインディング対策）
 * - ダウンロードサイズに上限
 *
 * インポート系ルート（x-sync / import-from-x / import-from-instagram）が
 * クライアント由来のURLをサーバー側で fetch するため、内部ネットワークへの
 * リクエストを封じる目的で使う。
 */

// 許可する画像ホスト（next.config.mjs の remotePatterns と対応）
const ALLOWED_HOSTS: Array<{ suffix: string; exact?: boolean }> = [
  { suffix: "pbs.twimg.com", exact: true },
  { suffix: ".cdninstagram.com" },
  { suffix: ".fbcdn.net" },
];

function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return ALLOWED_HOSTS.some((rule) =>
    rule.exact ? h === rule.suffix : h.endsWith(rule.suffix)
  );
}

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function inRange(ip: number, cidr: string): boolean {
  const [base, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ip & mask) === (ipToInt(base) & mask);
}

const PRIVATE_V4_CIDRS = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10", // CGNAT
  "127.0.0.0/8", // loopback
  "169.254.0.0/16", // link-local（クラウドメタデータ 169.254.169.254 を含む）
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
];

function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    const n = ipToInt(ip);
    return PRIVATE_V4_CIDRS.some((cidr) => inRange(n, cidr));
  }
  if (family === 6) {
    const lower = ip.toLowerCase();
    // IPv4-mapped (::ffff:a.b.c.d) は埋め込みIPv4で判定
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return (
      lower === "::1" || // loopback
      lower.startsWith("fc") || // unique-local fc00::/7
      lower.startsWith("fd") ||
      lower.startsWith("fe8") || // link-local fe80::/10
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb")
    );
  }
  return false;
}

export async function fetchImageSafely(
  rawUrl: string,
  opts: {
    maxBytes?: number;
    timeoutMs?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<Buffer> {
  const maxBytes = opts.maxBytes ?? 10 * 1024 * 1024; // 10MB
  const timeoutMs = opts.timeoutMs ?? 15000;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("不正な画像URLです");
  }

  if (url.protocol !== "https:") {
    throw new Error("https以外の画像URLは許可されていません");
  }
  if (!isAllowedHost(url.hostname)) {
    throw new Error(`許可されていない画像ホストです: ${url.hostname}`);
  }

  // 解決先IPが内部アドレスならブロック（許可ホストのDNSリバインディング対策）
  try {
    const addrs = await lookup(url.hostname, { all: true });
    if (addrs.some((a) => isPrivateIp(a.address))) {
      throw new Error("内部アドレスへの画像リクエストは許可されていません");
    }
  } catch (e) {
    // 内部アドレス検出時は再throw、名前解決失敗などはfetchに委ねる
    if (e instanceof Error && e.message.includes("内部アドレス")) throw e;
  }

  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: opts.headers,
  });
  if (!res.ok) {
    throw new Error(`画像ダウンロードに失敗しました: ${res.status}`);
  }
  const contentLength = Number(res.headers.get("content-length") || 0);
  if (contentLength && contentLength > maxBytes) {
    throw new Error("画像サイズが上限を超えています");
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > maxBytes) {
    throw new Error("画像サイズが上限を超えています");
  }
  return buffer;
}
