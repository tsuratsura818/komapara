import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

// インメモリフォールバック用
const rateMap = new Map<string, { count: number; resetAt: number }>();

// 定期的にクリーンアップ（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  rateMap.forEach((val, key) => {
    if (now > val.resetAt) rateMap.delete(key);
  });
}, 60_000);

// Upstash Ratelimit インスタンスのキャッシュ（windowMs単位）
const ratelimitCache = new Map<string, Ratelimit>();

function getUpstashRatelimit(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${limit}:${windowMs}`;
  const cached = ratelimitCache.get(cacheKey);
  if (cached) return cached;

  // windowMsをseconds文字列に変換
  const windowSec = Math.ceil(windowMs / 1000);
  const windowStr = `${windowSec} s` as const;

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, windowStr),
    prefix: "komapara:rl",
  });

  ratelimitCache.set(cacheKey, rl);
  return rl;
}

export async function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): Promise<{ success: boolean; remaining: number }> {
  // Upstash Redis が利用可能な場合
  const upstashRl = getUpstashRatelimit(limit, windowMs);
  if (upstashRl) {
    const result = await upstashRl.limit(key);
    return { success: result.success, remaining: result.remaining };
  }

  // インメモリフォールバック
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
