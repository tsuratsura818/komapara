import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 候補リスト v3（2026-07-17）— フォロワー数の精査結果を反映
 *
 * 【v2で私が入れてしまった誤り】
 *  - @iktaa222 / @rinpotage を「Xハンドル」として登録したが、どちらもInstagramのハンドルだった。
 *    ・いくたはな … Xは @suitondiary（IGが@iktaa222）。同一人物なので重複。しかも育児でなく百合/BL作家
 *    ・やまもとりえ … Xは @yamamotorie（IGが@rinpotage）。IG 37.1万に対しX 13万で2.9倍の過大評価になる
 *
 * 【判明したこと】
 *  - x.com が機械取得を拒否するため、フォロワー数は twicomi 等の第三者集計に頼るしかない。
 *    万単位表記のものは概数（例: 58万 → 実数575,000〜580,000）。
 *  - **X本体が実質死んでいる作家が複数いる**。IGやブログが主戦場で、Xの数値だけ見ると誤判断する。
 *    @chupeful___life はX 9〜81、@l_palpa は最終投稿2020年。
 */

/** フォロワー数の更新（両バッチの精査結果） */
const FOLLOWER_UPDATES: { xHandle: string; followers: number; note?: string }[] = [
  // ── バッチ1 ──
  { xHandle: "shigeno_naoki", followers: 24330, note: "【最優先】肩書きが「四コマ漫画家」。『信長の忍び』17年連載・アニメ化。4コマ一本で20年以上のプロ＝看板作家に最適。最終投稿2026-07-15で現役" },
  { xHandle: "kankitsu_BB", followers: 12116, note: "きらら『ざこのみなさんお大事に』1巻2026-06-26発売の現役。若手。最終投稿2026-06-23" },
  { xHandle: "MG_kotaro", followers: 89199, note: "【好機】「みんな同じ顔」の動物シュール4コマ。twicomi収録3,155本と極めて多作、最終投稿2026-07-16。★コミチが2026/9/30終了予定＝今まさに連載先を探しているはず" },
  { xHandle: "setoguchimizuki", followers: 14518, note: "『めんつゆひとり飯』ドラマ化、『ローカル女子の遠吠え』12巻。4コマ専業。最終投稿2026-07-11" },
  { xHandle: "abhachi_graphic", followers: 10800, note: "『会社員でぶどり』『毎日でぶどり』。★注意：「でぶどり23万/35万」はキャラ公式アカ@debu_doriとInstagramの値で、作家個人アカのXは約1.08万。20倍違うので混同禁止" },
  { xHandle: "higasiyameme", followers: 1604, note: "『リコーダーとランドセル』21巻・アニメ化。まんがライフオリジナル連載中。最終投稿2026-07-16。★作品の知名度に比してXは小規模(約1,600)" },
  { xHandle: "ooimasakazu", followers: 9159, note: "『ちぃちゃんのおしながき』20巻。まんがライフオリジナル連載中" },
  { xHandle: "warabimochi0508", followers: 10467, note: "きらら『しあわせ鳥見んぐ』3巻。野鳥観察4コマで題材が独特。★twicomi上の最終漫画投稿が2021-11で約4年半前。フォロワー数も古い可能性、要再確認" },
  { xHandle: "awoharu", followers: 10783, note: "『永久機関シマエナガ』KADOKAWA全5巻、2025-02と2026-02に新刊＝X発で書籍化が続く稀な例。最終投稿2026-07-14。作品公式は@SimaenagaEikyu" },
  { xHandle: "suitoryu", followers: 321, note: "ツイ4『リ・リ・リィンカーネーション』2025年6-11月連載(商業デビュー作)。★Xは321と極小。伸ばしたい段階＝ポータルの価値が刺さる可能性" },
  { xHandle: "azami", followers: 6880, note: "ツイ4『白熱日本酒教室』全3巻。日本酒イラスト展を開催するなど現役。最終投稿2026-05-03" },
  { xHandle: "nekotabiyori", followers: 8118, note: "【最優先】ジャンプ+『猫田びより』創刊日から毎日更新4200回超＝ジャンプ+で唯一の4コマ連載。Xは8,118と規模は小さい" },
  { xHandle: "msbcmnt2", followers: 1123, note: "猫のラップバトル4コマを毎日22:30-23:00更新。旧データの名前「まちゃぷみなみ」は誤り。★Xは1,123と小規模(単一ソースのため確度は低め)" },

  // ── バッチ2 ──
  { xHandle: "yajima_en", followers: 580000, note: "『ねこに転生したおじさん』2024-2025TVアニメ化、2026年も連載継続。最終投稿2026-07-17。★旧データ6万→実測約58万で10倍の誤り。リスト最大規模" },
  { xHandle: "katomayumi", followers: 403000, note: "『神童と猛獣』『おじさんと女子高生』。夫は横山了一。X主戦場型。★旧データ6万→実測約40万で6.7倍の誤り。最終投稿2026-07-05" },
  { xHandle: "marige333", followers: 63469, note: "ダ・ヴィンチWeb連載中。京都府舞鶴市在住、子4人。最終投稿2026-07-10。実数取得で信頼度高" },
  { xHandle: "gumamasan1", followers: 71729, note: "『こんなはずでは系育児』。企業案件も。最終投稿2026-06-28。実数取得で信頼度高" },
  { xHandle: "nonnyakonyako", followers: 101000, note: "KADOKAWA『パパが育休とってみたら』。公立高校教員兼業。最終投稿2026-07-16で現役" },
  { xHandle: "mirumirupakupa1", followers: 3959, note: "アメブロ公式トップブロガー。最終投稿2026-07-16で現役。★知名度に対しXは約4千と小規模＝主戦場はアメブロ" },
  { xHandle: "l_palpa", followers: 2812, note: "『ねこ漫画ナノトクラス』。4コマ漫画ブログランキング1位、書籍化あり。★X本体はほぼ休止(最終2020-09)。発表先はブログ/Instagram＝IG連携が刺さる層" },
  { xHandle: "chupeful___life", followers: 81, note: "育児4コマ。原作=大浦力/作画=妻の夫婦制作。パパ視点は希少。★X本体は2桁で実質機能しておらず、発表先はInstagram中心＝IG連携が本命" },
  { xHandle: "pinapapinapa", followers: 0, note: "ブログ『猫の手貸して』で3姉妹の日々を連載、ウーマンエキサイト連載。★Xの数値は確認できず。よく見る「20K」はInstagramの値でXの値ではない" },
  { xHandle: "pepuritan", followers: 0, note: "関西在住、7歳娘・4歳息子との家族日常マンガ。ウーマンエキサイト掲載。★Xの数値は確認できず。「39K」はInstagramの値" },
];

async function main() {
  // ── 1) 私がIGハンドルをXハンドルとして入れた誤りを是正 ──
  // いくたはな: IG=@iktaa222 / X=@suitondiary。同一人物なので重複。かつ育児でなく百合BL作家
  const iktaa = await prisma.creatorOutreach.findUnique({ where: { xHandle: "iktaa222" } });
  if (iktaa && iktaa.status === "候補") {
    await prisma.creatorOutreach.delete({ where: { xHandle: "iktaa222" } });
    console.log("削除: @iktaa222 … IGのハンドルだった。本人のXは@suitondiary(除外済/育児でなく百合BL作家)");
  }

  // やまもとりえ: IG=@rinpotage / X=@yamamotorie。正しいXハンドルに差し替える
  const rin = await prisma.creatorOutreach.findUnique({ where: { xHandle: "rinpotage" } });
  if (rin && rin.status === "候補") {
    await prisma.creatorOutreach.delete({ where: { xHandle: "rinpotage" } });
    console.log("削除: @rinpotage … IGのハンドルだった");
  }
  await prisma.creatorOutreach.upsert({
    where: { xHandle: "yamamotorie" },
    update: {},
    create: {
      xHandle: "yamamotorie",
      name: "やまもとりえ",
      genre: "育児",
      followers: 130000,
      note: "★元リストは「@rinpotage」(Instagramのハンドル)を誤ってXハンドルとして登録していた。本人のXは@yamamotorieで13万。IG(@rinpotage)は37.1万あり、IG値を使うと2.9倍の過大評価になる＝IG連携が刺さる層",
    },
  });
  console.log("追加: @yamamotorie … やまもとりえ本人のXハンドル");

  // ── 2) フォロワー数と註記を更新（statusは触らない） ──
  let updated = 0;
  for (const u of FOLLOWER_UPDATES) {
    const e = await prisma.creatorOutreach.findUnique({ where: { xHandle: u.xHandle } });
    if (!e) {
      console.log(`  ★見つからない: @${u.xHandle}`);
      continue;
    }
    await prisma.creatorOutreach.update({
      where: { xHandle: u.xHandle },
      data: { followers: u.followers, ...(u.note ? { note: u.note } : {}) },
    });
    updated++;
  }

  const all = await prisma.creatorOutreach.count();
  const known = await prisma.creatorOutreach.count({ where: { followers: { gt: 0 } } });
  console.log(`\n更新 ${updated}件 / 合計 ${all}件 / フォロワー確認済 ${known}件（未確認 ${all - known}件）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
