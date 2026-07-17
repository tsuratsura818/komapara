import crypto from "crypto";

/**
 * Meta の Deauthorize / Data Deletion コールバックは `signed_request` を POST してくる。
 * 形式は `<base64url署名>.<base64urlペイロード>` で、署名は
 * HMAC-SHA256(ペイロード文字列, アプリシークレット)。
 * 検証せずに中身を信じると、第三者が任意のユーザーのデータを消せてしまうため必須。
 */
export type SignedRequestPayload = {
  user_id?: string;
  algorithm?: string;
  issued_at?: number;
};

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function parseSignedRequest(
  signedRequest: string,
  appSecret: string
): SignedRequestPayload | null {
  const [encodedSig, encodedPayload] = signedRequest.split(".", 2);
  if (!encodedSig || !encodedPayload) return null;

  let payload: SignedRequestPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
  } catch {
    return null;
  }

  if (payload.algorithm && payload.algorithm.toUpperCase() !== "HMAC-SHA256") {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(encodedPayload)
    .digest();
  const actual = base64UrlDecode(encodedSig);

  // 長さが違うと timingSafeEqual が例外を投げるため先に確認する
  if (expected.length !== actual.length) return null;
  if (!crypto.timingSafeEqual(expected, actual)) return null;

  return payload;
}
