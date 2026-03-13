import { getRedis } from "./redis";

/**
 * 汎用キャッシュユーティリティ
 * Redis利用可能時はRedisキャッシュ、なければfetcher直接実行
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const redis = getRedis();

  if (!redis) {
    // Redis未設定時は素通し
    return fetcher();
  }

  // キャッシュから取得を試みる
  const cached = await redis.get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  // キャッシュミス: fetcherを実行してキャッシュに保存
  const data = await fetcher();
  await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });

  return data;
}
