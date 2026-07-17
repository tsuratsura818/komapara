import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 作家招待の候補リスト v2（2026-07-17）
 *
 * v1からの方針変更: **4コマ縛りを外した**。
 * サービス名と仕様書から「4コマ専門」と解釈して1コマ・エッセイ漫画を除外していたが、
 * 実際にはこだわらない方針だった。除外していた作家を戻し、育児層を厚くしている。
 * （育児漫画の主流は4コマでなく2〜4ページのコミックエッセイ。4コマ縛りだと
 *  最も層の厚いジャンルが丸ごと落ちる）
 *
 * 【それでも除外しているもの＝4コマかどうかとは別の理由】
 *  - @suitondiary … 「すいとん母さん(育児)」は誤り。実体は百合/BL作家「いくたはな」
 *  - @hikaru_illust … 田中光本人でなく事務所管理アカ（本人は @avocadohikaru）
 *  - @OLtaeko … 作者でなく作品『耐え子の日常』の公式アカ（本人は @sorotani_anime）
 *  - @yoshikiyun(2023-04で停止) / @pusuuuun(2022-07で停止) … 活動停止
 *  - @ameminori / @SeijiTakanashi / @miz0re_ / @sarinkon … 実体を確認できず
 *
 * 【フォロワー数の限界】
 * x.com はプロフィールの機械取得を拒否する（HTTP 402）。数値は第三者集計サイト
 * （ツイコミ等）由来で、更新時点が不明・サイト間で矛盾もある。**正確な現在値ではない。**
 * 特に育児層は有名な数値がInstagramの値で、X本体は1桁少ないことが多い
 * （モチコ: IG 13万 vs X 1.3万）。裏が取れなかったものは 0。
 * 優先度は数値でなく「直近の活動実績」で判断すること。
 *
 * 【status は絶対に上書きしない】
 * 手動でDM送信済などに進めたものを巻き戻さないため、既存レコードは
 * name/genre/followers/note のみ更新する。
 */
interface CreatorData {
  xHandle: string;
  name: string;
  genre: string;
  followers: number;
  note: string;
}

const creators: CreatorData[] = [
  // ═══ 4コマ縛りを外して復活させた作家 ═══
  { xHandle: "Dekopon_56", name: "でこぽん吾郎", genre: "育児", followers: 436000, note: "『ただいま！保育士でこ先生』191話を2026-07-11投稿、書籍3巻予約中。ベビーカレンダー連載。保育士エッセイ漫画。旧データ10万→実測43.6万で4倍超の乖離。リスト最大規模" },
  { xHandle: "ohoshintaro", name: "おほしんたろう", genre: "ギャグ", followers: 157000, note: "ナナロク社『学校と先生』、KADOKAWA『おほまんが』。ワタナベエンタ九州所属の芸人。1コマ漫画。中目黒 蔦屋書店でPOP UP。直近1日以内に投稿" },
  { xHandle: "sahoobb", name: "山本さほ", genre: "エッセイ", followers: 104000, note: "ファミ通『無邪気な16bit』・文春オンライン『おかあさんクエスト』連載中。『岡崎に捧ぐ』で注目。エッセイ/ストーリー漫画。最新2026-07-03" },
  { xHandle: "kurata_kei", name: "倉田けい", genre: "育児", followers: 116000, note: "『マンガおうち理科』等、CHANTO WEB連載。2026-07も毎日級で活動＝活動量とフォロワーが理想的" },

  // ═══ ツイ4（星海社）由来＝4コマをX毎日配信している層 ═══
  { xHandle: "841_MUSCLE", name: "あべまん", genre: "猫", followers: 263000, note: "ツイ4『のんびり村の役場猫』コミックス5巻、『ネコダマシ』。最終投稿2026-07中旬" },
  { xHandle: "nitorisasami", name: "にとりささみ", genre: "猫", followers: 274000, note: "『ふしぎねこのきゅーちゃん』全8巻、次にくるマンガ大賞web部門9位。最終投稿2026-07中旬" },
  { xHandle: "daioki", name: "大沖", genre: "ギャグ", followers: 64000, note: "ツイ4『こわい男とへんなねこ』全3巻、『はるみねーしょん』。最終投稿2026-07-10" },
  { xHandle: "hatori_niwatori", name: "津留崎優", genre: "ギャグ", followers: 85577, note: "ツイ4『教えてFGO！』連載中、『異世界美少女受肉おじさん』。最終投稿2025-12-22" },
  { xHandle: "Ce_Lemony", name: "銀河セレモニー☆☆☆", genre: "ギャグ", followers: 40945, note: "ツイ4『ニセ教養お姉さん』連載中。最終投稿2026-07-16・作品656本" },
  { xHandle: "Manpuku_GRL", name: "④（よなか）", genre: "ギャグ", followers: 35822, note: "ツイ4『相棒に毒がありまして！』商業デビュー作。最終投稿2026-07-11" },
  { xHandle: "chixida1106", name: "スズキダイチ", genre: "その他", followers: 29287, note: "ツイ4『君が死ぬほどコワい話』ホラー。秋田県在住。最終投稿2026-01-04" },
  { xHandle: "kazuma7kawamura", name: "河邑一真", genre: "日常", followers: 27366, note: "ツイ4『強くてカッコイイ女子は好きですか？』平日ほぼ毎日更新、最終投稿2026-07-16。※ツイ4表記は「川村一真」で名義が不一致、要確認" },
  { xHandle: "pontogotanda1", name: "ぽんとごたんだ", genre: "その他", followers: 10036, note: "ツイ4『ギャルとクトゥルフ』完結、漫画アクション『桐谷さんちょっそれ食うんすか！？』連載中。グルメ・ギャグ。最終投稿2026-07-09" },
  { xHandle: "awoharu", name: "青春", genre: "日常", followers: 0, note: "『永久機関シマエナガ』KADOKAWA全5巻、2025-02と2026-02に新刊＝X発で書籍化が続く稀な例。作品公式は@SimaenagaEikyu(2.8万)。個人アカのフォロワー数未確認" },
  { xHandle: "Belchiyan", name: "NOBEL", genre: "猫", followers: 29700, note: "ツイ4新人賞出身『猫の手だって役に立つ』全3巻。最終投稿2026-03-16。近年はゲーム系漫画中心で軸足が移動気味" },
  { xHandle: "kbys6uuupaaa", name: "小林ロク", genre: "仕事あるある", followers: 19030, note: "ツイ4『ぶっカフェ！』連載中(仏教・お仕事)。★ツイコミ最終が2024-01で2025-26の投稿が未確認、要生存確認" },
  { xHandle: "DaDacadaca1001", name: "ウニックス", genre: "猫", followers: 8600, note: "「カマチョ猫シリーズ」。LINEスタンプ・グッズ販売。最終投稿2026-03-01。商業実績のない純インディー＝ポータルの価値が刺さる層" },
  { xHandle: "suitoryu", name: "水藤流", genre: "日常", followers: 0, note: "ツイ4『リ・リ・リィンカーネーション』連載中(新人賞出身)。★ツイコミ未登録で活動の裏取り未了。フォロワー数未確認" },

  // ═══ 追加調査で見つかった育児層 ═══
  { xHandle: "l_palpa", name: "ぱるぱーる", genre: "猫", followers: 0, note: "『ねこ漫画ナノトクラス』。4コマ漫画ブログランキング1位、書籍化あり。毎週火・金20時更新。フォロワー数未確認" },
  { xHandle: "yupoko17", name: "よしだゆうこ", genre: "育児", followers: 5712, note: "マイナビニュース『息子が大きくなりまして』全118回完結→後継連載『子育て完了！？』開始。記事に毎回【4コマ漫画】と明記" },
  { xHandle: "pinapapinapa", name: "ぴなぱ", genre: "育児", followers: 0, note: "ブログ『猫の手貸して』で3姉妹の日々を連載、ウーマンエキサイト連載。フォロワー数未確認(IG2万超)" },
  { xHandle: "chupeful___life", name: "ちゅーぴふるライフ", genre: "育児", followers: 0, note: "アカウント名に「育児4コマ漫画」を明記。原作=大浦力/作画=妻の夫婦制作。パパ視点は希少。毎週水曜更新" },
  { xHandle: "iktaa222", name: "いくたはな", genre: "育児", followers: 0, note: "★元リストが「柴犬Uki」と誤記していた本人。フォロワー数未確認" },
  { xHandle: "rinpotage", name: "やまもとりえ", genre: "育児", followers: 0, note: "★元リストが「rinpotage」(ハンドルの読み下し)と誤記していた本人。フォロワー数未確認" },
  { xHandle: "pepuritan", name: "ぺぷり", genre: "育児", followers: 0, note: "関西在住、7歳娘・4歳息子との家族日常マンガ。ウーマンエキサイト漫画家一覧に掲載。フォロワー数未確認" },
];

/** 4コマ縛りを外したので、v1で「4コマではない」と減点していた註記を書き換える */
const NOTE_REWRITES: Record<string, string> = {
  torikaworks:
    "育児漫画の代表格。ベビーカレンダー連載、グッズ展開。ツイコミ上で毎日級の活動を確認。単コマ〜短編形式（4コマではないが方針上問題なし）",
  tongarirooms:
    "『うちの猫がまた変なことしてる。』8巻・累計50万部、レタスクラブ連載、Ameba公式トップブロガー。2026-04-10の投稿が13.2万いいね。★旧リストが@kyuryuZと取り違えていた本人",
  mochicodiary:
    "『育児ってこんなに笑えるんや！』、ダ・ヴィンチWeb・ウーマンエキサイト連載。★有名な13万はInstagramの値でX本体は約1.3万。IG基盤が強くIG連携と最も相性が良い層。Xの直近活動は未確認(twicomi最終2024-06)",
  nyanyavo:
    "『しみことトモヱ 猫がいるから大丈夫』(イースト・プレス)。ブログほぼ毎日更新。最終投稿2025-12-31",
};

async function main() {
  console.log(`追加/更新 ${creators.length}件 + 註記の書き換え ${Object.keys(NOTE_REWRITES).length}件`);
  let created = 0;
  let updated = 0;

  for (const c of creators) {
    const existing = await prisma.creatorOutreach.findUnique({
      where: { xHandle: c.xHandle },
    });
    if (existing) {
      // status/dmSentAt/repliedAt は手動で進めた実績なので絶対に触らない
      await prisma.creatorOutreach.update({
        where: { xHandle: c.xHandle },
        data: { name: c.name, genre: c.genre, followers: c.followers, note: c.note },
      });
      updated++;
    } else {
      await prisma.creatorOutreach.create({ data: c });
      created++;
    }
  }

  for (const [xHandle, note] of Object.entries(NOTE_REWRITES)) {
    const e = await prisma.creatorOutreach.findUnique({ where: { xHandle } });
    if (e) {
      await prisma.creatorOutreach.update({ where: { xHandle }, data: { note } });
      console.log(`  註記を更新: @${xHandle}`);
    }
  }

  console.log(`\n新規 ${created}件 / 更新 ${updated}件 / 合計 ${await prisma.creatorOutreach.count()}件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
