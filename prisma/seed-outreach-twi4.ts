import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * ツイ4（星海社）由来の候補（2026-07-17）
 *
 * ツイ4の全作品ページから作者のXハンドルを機械的に抽出（60名）。
 * ハンドルはページの「○○をTwitterでフォローする」ボタンから取得しており、
 * ハンドルの読み下し推測は一切していない＝人名は信頼できる。
 *
 * 【ただし歩留まりは低い。60件を全部入れない理由】
 *  - **ほぼ全てが「完結」作品**。連載中は既知の@sankakujougiのみ
 *  - **フォロワー・直近の活動が全件不明**（x.comが402で機械取得を拒否）
 * → 「4コマを描いていた実績はあるが、今どうしているか不明」な名簿。
 *   全件入れると検証済みの候補が薄まって使いにくくなるため、
 *   **実績が突出していて名前で引きが作れる人だけ**を選抜した。
 *
 * 全員 note に「★要活動確認」を明記している。声をかける前に必ず本人のXを開くこと。
 */
interface CreatorData {
  xHandle: string;
  name: string;
  genre: string;
  followers: number;
  note: string;
}

const creators: CreatorData[] = [
  // ── アニメ化・大ヒット作を持つ層（名前で引きが作れる）──
  { xHandle: "fumita_yanagida", name: "柳田史太", genre: "恋愛", followers: 0, note: "ツイ4『トモちゃんは女の子！』全953話・TVアニメ化。ツイ4最長級のヒット作。★完結済・要活動確認" },
  { xHandle: "harimoguni", name: "谷川ニコ", genre: "ギャグ", followers: 0, note: "『私がモテないのはどう考えてもお前らが悪い！』の作者。ツイ4『クズとメガネと文学少女（偽）』。★完結済・要活動確認" },
  { xHandle: "bkub_comic", name: "大川ぶくぶ", genre: "ギャグ", followers: 0, note: "『ポプテピピック』の作者。ツイ4『ハニカムチャッカ』『あんさんぶくぶスターズ！』。企業タイアップ4コマ多数。★完結済・要活動確認" },
  { xHandle: "igagarashi", name: "五十嵐正邦", genre: "恋愛", followers: 0, note: "ツイ4『川柳少女』TVアニメ化。五七五でしか話せない少女の日常。★完結済・要活動確認" },
  { xHandle: "Yupechika", name: "ユペチカ", genre: "日常", followers: 0, note: "ツイ4『サトコとナダ』全402話。サウジ人留学生との共同生活を描く異文化4コマ。書籍化。★完結済・要活動確認" },
  { xHandle: "TEIGI_3", name: "和武はざの", genre: "恋愛", followers: 0, note: "ツイ4『白聖女と黒牧師』TVアニメ化。★完結済・要活動確認" },

  // ── 4コマで独自の題材を持つ層（komaparaの品揃えに効く）──
  { xHandle: "baccheuo", name: "佐藤二葉", genre: "その他", followers: 0, note: "ツイ4『アンナ・コムネナ』『うたえ！エーリンナ』。ビザンツ皇女・古代ギリシアを描く歴史4コマ＝題材が唯一無二。★完結済・要活動確認" },
  { xHandle: "rekisikei", name: "亀", genre: "その他", followers: 0, note: "ツイ4『レキアイ！ 歴史と愛』『異世界転生!!マルクスくん』。笑えて学べる歴史・教養系4コマ。★完結済・要活動確認" },
  { xHandle: "shouheikawasaki", name: "川崎昌平", genre: "仕事あるある", followers: 0, note: "ツイ4『重版未定』出版業界の内幕を描く。編集者視点の仕事4コマ。★完結済・要活動確認" },
  { xHandle: "wildlife_daily", name: "一日一種", genre: "その他", followers: 0, note: "ツイ4『鳥見部の小鳥遊さん』。生きもの系の描き手でバードウォッチング4コマ。★完結済・要活動確認" },
  { xHandle: "horrormove", name: "コットン バレント", genre: "猫", followers: 0, note: "ツイ4『CreepyCat 猫と私の奇妙な生活』。ホラー風味の猫4コマ＝猫ジャンルで差別化できる。★完結済・要活動確認" },
  { xHandle: "pon0737", name: "ポン", genre: "その他", followers: 0, note: "ツイ4『ノヒマンガ』365日毎日更新の記念日マンガ。SmartNewsタイアップも。★毎日更新の体力がある。完結済・要活動確認" },

  // ── 多作でツイ4に複数連載を持っていた層 ──
  { xHandle: "shoma_keito", name: "ショウマケイト", genre: "ギャグ", followers: 0, note: "ツイ4で4作連載（『恋するビリオネア』『サキちゃん』『タカシ』『ともだちをつくろう。』）。★完結済・要活動確認" },
  { xHandle: "zundacroquette", name: "ずんだコロッケ", genre: "仕事あるある", followers: 0, note: "ツイ4で3作連載（『まおーわーく』魔王城の社畜など）。仕事ネタが得意。★完結済・要活動確認" },
  { xHandle: "dka_hero", name: "HERO", genre: "恋愛", followers: 0, note: "ツイ4『彼はカメレオン』『レンタルフレンド』。高校生の青春ラブコメを2作連載。★完結済・要活動確認" },
  { xHandle: "sensiya_sensya", name: "千氏夜", genre: "恋愛", followers: 0, note: "ツイ4『素直になれない愛染さん』『恋愛しんふぉに〜』。★完結済・要活動確認" },
];

async function main() {
  console.log(`ツイ4由来の選抜 ${creators.length}件を追加します（60名から実績で選抜）`);
  let created = 0;
  let skipped = 0;

  for (const c of creators) {
    const existing = await prisma.creatorOutreach.findUnique({
      where: { xHandle: c.xHandle },
    });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.creatorOutreach.create({ data: c });
    created++;
  }

  const all = await prisma.creatorOutreach.count();
  console.log(`新規 ${created}件 / 既存でスキップ ${skipped}件 / 合計 ${all}件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
