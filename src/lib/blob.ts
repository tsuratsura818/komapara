import { put } from "@vercel/blob";

// 公開Blobストア（komapara-media）へ画像を保存する。
// @vercel/blob 既定の BLOB_READ_WRITE_TOKEN ではなく、公開ストア用の
// KOMAPARA_READ_WRITE_TOKEN を明示指定する（旧プライベートストア komapara-images との
// トークン名衝突を避けるため、接続時プレフィックスを KOMAPARA にしている）。
export function putImage(pathname: string, body: Buffer) {
  return put(pathname, body, {
    access: "public",
    contentType: "image/webp",
    token: process.env.KOMAPARA_READ_WRITE_TOKEN,
  });
}
