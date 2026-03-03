import sharp from "sharp";

export interface ProcessedImage {
  buffer: Buffer;
  filename: string;
  width: number;
  height: number;
}

/**
 * 画像をWebP形式に変換する
 * 4コマ漫画向け: quality 85 で高品質を維持しつつサイズ削減
 */
export async function processImageToWebP(
  inputBuffer: Buffer,
  uuid: string,
  options?: { maxWidth?: number; quality?: number }
): Promise<ProcessedImage> {
  const { maxWidth = 1600, quality = 85 } = options ?? {};

  let image = sharp(inputBuffer);
  const metadata = await image.metadata();

  if (metadata.width && metadata.width > maxWidth) {
    image = image.resize({ width: maxWidth, withoutEnlargement: true });
  }

  const webpBuffer = await image
    .webp({ quality, effort: 4 })
    .toBuffer();

  const webpMeta = await sharp(webpBuffer).metadata();

  return {
    buffer: webpBuffer,
    filename: `${uuid}.webp`,
    width: webpMeta.width ?? 0,
    height: webpMeta.height ?? 0,
  };
}

/**
 * サムネイル画像を生成する（WorkCard用 400x400）
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  uuid: string,
  size: number = 400
): Promise<ProcessedImage> {
  const thumbBuffer = await sharp(inputBuffer)
    .resize({ width: size, height: size, fit: "cover" })
    .webp({ quality: 75 })
    .toBuffer();

  return {
    buffer: thumbBuffer,
    filename: `${uuid}_thumb.webp`,
    width: size,
    height: size,
  };
}
