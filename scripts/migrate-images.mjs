/**
 * 既存画像をWebPに一括変換するマイグレーションスクリプト
 *
 * 使い方:
 *   node scripts/migrate-images.mjs          # ドライラン（変換対象を表示）
 *   node scripts/migrate-images.mjs --run     # 実行（変換+DB更新）
 *   node scripts/migrate-images.mjs --cleanup  # 変換後の旧ファイル削除
 */

import { readdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const shouldRun = args.includes("--run");
const shouldCleanup = args.includes("--cleanup");

async function main() {
  // アップロードディレクトリのファイル一覧
  const files = await readdir(UPLOAD_DIR);
  const targetFiles = files.filter(
    (f) => /\.(jpg|jpeg|png)$/i.test(f) && !f.includes("_thumb")
  );

  console.log(`対象ファイル: ${targetFiles.length}件`);

  if (shouldCleanup) {
    // 旧ファイル削除モード
    let deleted = 0;
    for (const file of targetFiles) {
      const webpName = file.replace(/\.(jpg|jpeg|png)$/i, ".webp");
      if (files.includes(webpName)) {
        await unlink(path.join(UPLOAD_DIR, file));
        deleted++;
        console.log(`  削除: ${file}`);
      }
    }
    console.log(`\n${deleted}件の旧ファイルを削除しました`);
    await prisma.$disconnect();
    return;
  }

  if (!shouldRun) {
    console.log("\nドライラン: 変換対象のファイル一覧");
    for (const file of targetFiles) {
      console.log(`  ${file}`);
    }
    console.log("\n実行するには: node scripts/migrate-images.mjs --run");
    await prisma.$disconnect();
    return;
  }

  // WebP変換
  let converted = 0;
  const urlMapping = new Map(); // old URL -> new URL

  for (const file of targetFiles) {
    const inputPath = path.join(UPLOAD_DIR, file);
    const baseName = file.replace(/\.(jpg|jpeg|png)$/i, "");
    const webpName = `${baseName}.webp`;
    const thumbName = `${baseName}_thumb.webp`;
    const webpPath = path.join(UPLOAD_DIR, webpName);
    const thumbPath = path.join(UPLOAD_DIR, thumbName);

    // 既にWebP版がある場合はスキップ
    if (files.includes(webpName)) {
      urlMapping.set(`/uploads/${file}`, `/uploads/${webpName}`);
      console.log(`  スキップ（変換済み）: ${file}`);
      continue;
    }

    try {
      // フルサイズWebP
      await sharp(inputPath)
        .resize({ width: 2000, withoutEnlargement: true })
        .webp({ quality: 85, effort: 4 })
        .toFile(webpPath);

      // サムネイル
      if (!files.includes(thumbName)) {
        await sharp(inputPath)
          .resize({ width: 400, height: 400, fit: "cover" })
          .webp({ quality: 75 })
          .toFile(thumbPath);
      }

      urlMapping.set(`/uploads/${file}`, `/uploads/${webpName}`);
      converted++;
      console.log(`  変換: ${file} → ${webpName}`);
    } catch (err) {
      console.error(`  エラー: ${file} — ${err.message}`);
    }
  }

  console.log(`\n${converted}件を変換しました`);

  // DB更新（Work.panels のURLを更新）
  if (urlMapping.size > 0) {
    const works = await prisma.work.findMany({
      select: { id: true, panels: true },
    });

    let dbUpdated = 0;
    for (const work of works) {
      let changed = false;
      const newPanels = work.panels.map((panel) => {
        const newUrl = urlMapping.get(panel);
        if (newUrl) {
          changed = true;
          return newUrl;
        }
        return panel;
      });

      if (changed) {
        await prisma.work.update({
          where: { id: work.id },
          data: { panels: newPanels },
        });
        dbUpdated++;
      }
    }
    console.log(`DB更新: ${dbUpdated}件の作品パネルURLを更新`);
  }

  console.log("\n完了! 旧ファイル削除は: node scripts/migrate-images.mjs --cleanup");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
