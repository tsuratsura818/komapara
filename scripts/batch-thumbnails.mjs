/**
 * Lorem Picsum を使って全作品のパネル画像を設定するスクリプト
 * （認証不要・レート制限なし）
 *
 * 使い方:
 *   node scripts/batch-thumbnails.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Picsum の画像IDリスト（800x800正方形で取得）
// テーマ別に良い写真のIDを事前選定
const IMAGE_SETS = {
  cat: [40, 200, 219, 237, 256, 292, 325, 342, 404, 421, 441, 455, 504, 582, 593, 611, 659, 669, 718, 783],
  office: [3, 7, 48, 60, 119, 160, 180, 201, 295, 306, 366, 380, 395, 403, 452, 493, 508, 534, 599, 630],
  daily: [10, 28, 42, 55, 75, 100, 110, 142, 175, 191, 225, 250, 274, 301, 334, 367, 399, 428, 466, 501],
  romance: [14, 47, 63, 91, 114, 152, 177, 204, 244, 270, 311, 339, 370, 411, 443, 478, 517, 548, 584, 620],
  baby: [17, 26, 54, 76, 95, 122, 155, 183, 212, 239, 268, 299, 331, 358, 391, 419, 447, 481, 519, 553],
  funny: [22, 49, 67, 88, 108, 137, 163, 189, 222, 253, 287, 316, 348, 377, 406, 439, 471, 500, 529, 565],
  emotional: [11, 33, 58, 82, 104, 133, 165, 196, 228, 255, 286, 320, 354, 383, 416, 449, 488, 522, 555, 590],
  lifestyle: [5, 30, 52, 73, 97, 128, 158, 186, 218, 247, 278, 308, 338, 369, 398, 432, 462, 496, 527, 560],
  rain: [13, 38, 65, 89, 118, 146, 173, 203, 234, 263, 296, 327, 355, 387, 420, 453, 485, 513, 544, 579],
  nature: [15, 29, 50, 77, 106, 135, 168, 195, 227, 259, 290, 323, 352, 385, 414, 446, 479, 510, 543, 575],
};

// タイトル → 画像セット マッピング
const TITLE_IMAGE_MAP = [
  { match: /猫|ネコ|にゃん|段ボール|掃除機/, set: "cat" },
  { match: /朝|月曜|会議|上司|仕事|社食|エレベーター|リモート|金曜/, set: "office" },
  { match: /コンビニ|自販機|昼|チャイム/, set: "daily" },
  { match: /雨|傘|相合/, set: "rain" },
  { match: /休日|二度寝/, set: "lifestyle" },
  { match: /片思い|告白|好き|LINE|既読|デート/, set: "romance" },
  { match: /育児|夜泣き|離乳|パパ|抱っこ|子ども|寝顔|公園/, set: "baby" },
  { match: /おくり狼|アオン/, set: "nature" },
];

// タグ → 画像セット マッピング
const TAG_IMAGE_MAP = {
  猫: "cat",
  日常: "daily",
  仕事あるある: "office",
  ギャグ: "funny",
  恋愛: "romance",
  感動: "emotional",
  育児: "baby",
  エッセイ: "lifestyle",
};

function getImageSet(work) {
  // タイトルベース
  for (const { match, set } of TITLE_IMAGE_MAP) {
    if (match.test(work.title)) {
      return set;
    }
  }
  // タグベース
  for (const tag of work.tags.map((t) => t.name)) {
    if (TAG_IMAGE_MAP[tag]) {
      return TAG_IMAGE_MAP[tag];
    }
  }
  return "daily";
}

// 各セットで使用済みインデックスを追跡
const usedIndexes = new Map();

function getUniqueImages(setName, count) {
  const ids = IMAGE_SETS[setName];
  if (!usedIndexes.has(setName)) {
    usedIndexes.set(setName, 0);
  }
  let idx = usedIndexes.get(setName);
  const result = [];
  for (let i = 0; i < count; i++) {
    const id = ids[idx % ids.length];
    result.push(`https://picsum.photos/id/${id}/800/800`);
    idx++;
  }
  usedIndexes.set(setName, idx);
  return result;
}

async function main() {
  const works = await prisma.work.findMany({
    select: { id: true, title: true, panels: true, tags: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const targetWorks = works.filter((w) => w.panels.some((p) => p.includes("placehold")));

  console.log(`対象: ${targetWorks.length}作品 / 全${works.length}作品\n`);

  if (targetWorks.length === 0) {
    console.log("全作品のパネルが設定済みです");
    await prisma.$disconnect();
    return;
  }

  let updated = 0;

  for (const work of targetWorks) {
    const setName = getImageSet(work);
    const newPanels = getUniqueImages(setName, work.panels.length);

    await prisma.work.update({
      where: { id: work.id },
      data: { panels: newPanels },
    });

    updated++;
    console.log(`  ✓ ${work.title} (${work.panels.length}パネル, セット: ${setName})`);
  }

  console.log(`\n--- 完了 ---`);
  console.log(`更新: ${updated}件`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
