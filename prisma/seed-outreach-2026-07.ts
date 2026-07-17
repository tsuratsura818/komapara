import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 作家招待の候補リスト（2026-07-17 全件再調査版）
 * 旧版は prisma/seed-outreach.ts に経緯として残してある。実運用はこちらを使う。
 *
 * 【旧版で分かった問題】
 * 旧版のハンドル一覧は2018年10月のまとめ記事(kodomo-asobiba.com)と完全一致しており、
 * 独自調査ではなかった。そのため:
 *  - フォロワー数が8年前の値（最大20倍のズレ。@yan_mugi 5千→10万、@bou128 1万→31.8万）
 *  - 人名が「ハンドル名や作品名の誤読」だったものが10件以上
 *    （@bakanoakachan「サボり先輩」は作品名／@kyuryuZ「卵山玉子」は完全な別人）
 *  - そもそも4コマ作家でないものが混在（1コマ漫画・エッセイ漫画・百合BL作家）
 * 全件をWeb検索で再確認して作り直した。
 *
 * 【フォロワー数の限界（重要）】
 * x.com はプロフィールの機械取得を拒否する（HTTP 402）。よってフォロワー数は
 * 第三者集計サイト（ツイコミ等）の値で、更新時点が不明・サイト間で矛盾もある。
 * **数値は「規模の目安」であって正確な現在値ではない。** 裏が取れなかったものは 0。
 * 優先度は数値でなく「直近の活動実績」で判断すること。
 *
 * 【除外したもの】
 *  - @suitondiary … 育児漫画家ではなく百合/BL作家「いくたはな」。人物特定が誤り
 *  - @hikaru_illust … 田中光本人でなく事務所管理アカ。かつ1コマ漫画
 *  - @OLtaeko … 作者でなく作品『耐え子の日常』の公式アカ。かつ1コマ漫画
 *  - @ohoshintaro / @sahoobb / @Dekopon_56 … 1コマ漫画・エッセイ漫画で4コマではない
 *  - @yoshikiyun(2023-04で停止) / @pusuuuun(2022-07で停止) … 活動停止
 *  - @ameminori / @SeijiTakanashi / @miz0re_ / @sarinkon … 実体を一切確認できず
 *  - @tsumugitopan … 法人化済(株式会社つむぱぱ)で主戦場がIG/TikTok
 *  - @minorikambe … ビジネス書寄りで4コマ枠でない可能性
 *  - @mihajlo0011 … 旧13万はInstagramの値の可能性が高く、Xの実態が不明
 *  - @TsuyoshiWood(鴻池剛/98万) … 規模が大きすぎ、4コマ主体かも不明
 *  - @k_i_121 … 最新投稿2025-09で約10ヶ月の空白
 */
interface CreatorData {
  xHandle: string;
  name: string;
  genre: string;
  followers: number;
  note: string;
}

const creators: CreatorData[] = [
  // ═══ 4コマ専業・現役（最優先）═══
  { xHandle: "tunatu727", name: "津夏なつな", genre: "ギャグ", followers: 77020, note: "【最優先】4コマ専業。毎日8時/18時更新。『マイナビ転職4コマ』『ハーレム勇者伝説』(ジャンプ+)。自サイト4コマ限界ノック運営。旧データ8千は10倍の誤り" },
  { xHandle: "sekino4koma", name: "せきの", genre: "日常", followers: 168000, note: "【最優先】4コマ専業。ブログ「たのしい4コマ」で継続更新(2026-07-06)。旧データ1万は大幅に過小" },
  { xHandle: "period_apos", name: "ゴードン松坂", genre: "ギャグ", followers: 46983, note: "【最優先】#ずんどこどっかんぼん を月水金に定期投稿、1000本超。SNS完結型で商業実績なし＝ポータルの価値が刺さる層。旧データ5千は9倍の誤り" },
  { xHandle: "shigeno_naoki", name: "重野なおき", genre: "ギャグ", followers: 0, note: "【最優先】肩書きが「四コマ漫画家」。『信長の忍び』17年連載・アニメ化。4コマ一本で20年以上のプロ＝看板作家に最適。フォロワー数未確認" },
  { xHandle: "nekotabiyori", name: "久楽", genre: "猫", followers: 0, note: "【最優先】ジャンプ+『猫田びより』創刊日から毎日更新4200回超。ジャンプ+で唯一の4コマ連載。フォロワー数未確認" },
  { xHandle: "kKw3Nyh36SyitTJ", name: "岡野く仔", genre: "ギャグ", followers: 196100, note: "ツイ4『悪役令嬢の四畳半』毎日13時更新。単行本2巻" },
  { xHandle: "msbcmnt2", name: "ますぶちみなと", genre: "猫", followers: 0, note: "猫のラップバトル4コマを毎日22:30-23:00更新。旧データの名前「まちゃぷみなみ」は誤り。フォロワー数未確認" },
  { xHandle: "ruru_ie", name: "留々家", genre: "日常", followers: 25800, note: "「1時間4コマ会」参加。旧データ3万から微減の可能性" },
  { xHandle: "sobomiyako98", name: "きよまろ", genre: "日常", followers: 12325, note: "KADOKAWA『祖母みや子100歳』、芳文社まんがタイム新人賞。連載『おじょうさんはド直球』。医療従事者兼業。旧データとほぼ一致" },

  // ═══ コミチ終了で移籍先を探している可能性（今が好機）═══
  { xHandle: "MG_kotaro", name: "小山コータロー", genre: "ギャグ", followers: 0, note: "【好機】「みんな同じ顔」の動物シュール4コマ。withnews・コミチ連載。★コミチが2026/9/30終了予定＝今まさに連載先を探しているはず" },

  // ═══ 商業4コマ誌の実力派 ═══
  { xHandle: "choboraunyopomi", name: "ちょぼらうにょぽみ", genre: "ギャグ", followers: 114000, note: "『あいまいみー』アニメ化。ラブライブ/ダンまち等IPタイアップ多数。2026-07も投稿" },
  { xHandle: "1093yuiko", name: "篤見唯子", genre: "日常", followers: 41300, note: "まんがタイムきらら『スロウスタート』13巻・TVアニメ化" },
  { xHandle: "rasuko_okuma", name: "大熊らすこ", genre: "日常", followers: 18300, note: "きらら『星屑テレパス』アニメ化・ドラマ化。VTuber活動もあり露出に積極的" },
  { xHandle: "hisamaku_mako", name: "ひさまくまこ", genre: "日常", followers: 14600, note: "きらら『一畳間まんきつ暮らし！』2026年TVアニメ放送中＝話題性が高い" },
  { xHandle: "higasiyameme", name: "東屋めめ", genre: "日常", followers: 0, note: "『リコーダーとランドセル』21巻・アニメ化。まんがライフオリジナル連載中。フォロワー数未確認" },
  { xHandle: "ooimasakazu", name: "大井昌和", genre: "日常", followers: 0, note: "『ちぃちゃんのおしながき』20巻。まんがライフオリジナル連載中。フォロワー数未確認" },
  { xHandle: "setoguchimizuki", name: "瀬戸口みづき", genre: "仕事あるある", followers: 0, note: "『めんつゆひとり飯』ドラマ化、『ローカル女子の遠吠え』12巻。4コマ専業。フォロワー数未確認" },
  { xHandle: "warabimochi0508", name: "わらびもちきなこ", genre: "日常", followers: 0, note: "きらら『しあわせ鳥見んぐ』3巻。野鳥観察4コマで題材が独特。フォロワー数未確認" },
  { xHandle: "kankitsu_BB", name: "薗田かんきつ", genre: "ギャグ", followers: 0, note: "きらら『ざこのみなさんお大事に』単行本2026/6/26発売の現役。若手。フォロワー数未確認" },
  { xHandle: "moyoribiyori", name: "遥那もより", genre: "日常", followers: 17749, note: "LINEマンガ連載、KADOKAWA『パンダのミライ』。4コマ評論記事も書く「4コマ愛」層＝趣旨に共感しやすい" },

  // ═══ 猫（Xで最も伸びるジャンル）═══
  { xHandle: "vriGOpzvmMRE5Dv", name: "にごたろ", genre: "猫", followers: 170000, note: "『拾い猫のモチャ』X発の猫4コマ→KADOKAWA書籍化、2025/11新刊。旧データの名前「にこあん」は誤り" },
  { xHandle: "sobun_nekomanga", name: "湊文", genre: "猫", followers: 159000, note: "『猫の菊ちゃん』KADOKAWA既刊3巻。旧データの名前「そぶん」はハンドルの誤読" },
  { xHandle: "bou128", name: "AKR", genre: "猫", followers: 318300, note: "『黒猫ろんと暮らしたら』既刊8巻。★旧データ1万は桁が2つ違う（実測31.8万）" },
  { xHandle: "yajima_en", name: "やじま", genre: "猫", followers: 0, note: "『ねこに転生したおじさん』2024-2025TVアニメ化、2026年も連載継続。フォロワー数未確認(IG18万)" },
  { xHandle: "pandania0", name: "ぱんだにあ", genre: "猫", followers: 295800, note: "『ねこようかい』まんがライフオリジナル連載中、既刊11巻+" },
  { xHandle: "Qrais_Usagi", name: "キューライス", genre: "猫", followers: 289100, note: "『ネコノヒー』『スキウサギ』アニメ化。本名 坂元友介" },
  { xHandle: "mirumirupakupa1", name: "藤緒ミルカ", genre: "猫", followers: 0, note: "アメブロ公式トップブロガー。2026年も投稿継続。旧データの名前「みるみるパクパク」はハンドルの誤読。フォロワー数未確認" },
  { xHandle: "tongarirooms", name: "卵山玉子", genre: "猫", followers: 67769, note: "『うちの猫がまた変なことしてる。』8巻・累計50万部、レタスクラブ連載。★旧リストが@kyuryuZと取り違えていた本人。4コマ形式かは未確認" },
  { xHandle: "hidekiccan", name: "松本ひで吉", genre: "猫", followers: 670849, note: "『犬と猫どっちも飼ってると毎日たのしい』講談社。★旧データの名前「山本ひでき」は誤り。規模が大きく難易度は高い" },
  { xHandle: "kyuryuZ", name: "キュルZ", genre: "猫", followers: 902200, note: "『夜は猫といっしょ』既刊8巻・TVアニメ化、毎週更新。★★旧データは「卵山玉子」と誤記＝完全な別人。規模が大きく難易度は高い" },

  // ═══ 育児 ═══
  { xHandle: "yan_mugi", name: "つん", genre: "育児", followers: 99985, note: "家族マンガ1,500本超、2026-07-12投稿。★旧データの名前「麦」は誤り、フォロワーは20倍差(5千→10万)" },
  { xHandle: "39baby_com", name: "るしこ", genre: "育児", followers: 122000, note: "KADOKAWA『るしこの子育て日記』全4巻。直近も投稿あり" },
  { xHandle: "torikaworks", name: "ふるえるとり", genre: "育児", followers: 184000, note: "★4コマではない（単コマ〜短編形式）。ベビーカレンダー連載、現役で毎日級の活動。参考掲載" },
  { xHandle: "3MshXcteuuT241U", name: "さざなみ", genre: "育児", followers: 91700, note: "X投稿1年でフォロワー急増→KADOKAWA書籍化。X発→書籍化の成功例。旧データ2万は4.6倍の誤り" },
  { xHandle: "nikukyupunio", name: "にくきゅうぷにお", genre: "育児", followers: 55949, note: "『ぷにぷにぷにおちゃん』1-4巻。2026-07-02投稿。旧データ1万は5.6倍の誤り" },
  { xHandle: "maetel_arch", name: "メーテル", genre: "育児", followers: 20168, note: "2026-07-04投稿、通算1,131作品。旧データの名前「まーてる」は不正確" },
  { xHandle: "Pukutyma", name: "プクティ", genre: "育児", followers: 21016, note: "育児4コマ。ウーマンエキサイト等で連載、LINEスタンプ。外部媒体への露出に意欲的" },
  { xHandle: "yokoyama_bancho", name: "横山了一", genre: "育児", followers: 316000, note: "『北の旦那と西の嫁』。Yahoo!ニュースエキスパート。妻は加藤マユミ。旧データ7万は4.5倍の誤り" },
  { xHandle: "katomayumi", name: "加藤マユミ", genre: "育児", followers: 0, note: "『神童と猛獣』『おじさんと女子高生』。夫は横山了一。育児のみでなく創作漫画が主体。フォロワー数未確認" },
  { xHandle: "marige333", name: "まりげ", genre: "育児", followers: 0, note: "ダ・ヴィンチWeb連載中。京都府舞鶴市在住、子4人。フォロワー数未確認" },
  { xHandle: "gumamasan1", name: "chiiko", genre: "育児", followers: 0, note: "『こんなはずでは系育児』。企業案件も。フォロワー数は出典間で矛盾のため未設定" },
  { xHandle: "nonnyakonyako", name: "パパ頭", genre: "育児", followers: 0, note: "KADOKAWA『パパが育休とってみたら』。公立高校教員兼業。フォロワー数未確認" },
  { xHandle: "mochicodiary", name: "モチコ", genre: "育児", followers: 12956, note: "育児4コマ。『育児ってこんなに笑えるんや！』。★有名な13万はInstagramの値でX本体は約1.3万。Xの直近活動は未確認(twicomi最終2024-06)" },
  { xHandle: "pokotaroooooo", name: "ぽこたろー", genre: "育児", followers: 2833, note: "育児4コマ。毎週火・金21時に定期投稿。ママ広場連載。★フォロワー2,833と小規模、最終投稿2024-12" },
  { xHandle: "snsnblog", name: "しらこ", genre: "育児", followers: 1967, note: "育児4コマ。2026-07-14投稿で現役。★フォロワー1,967と小規模だが4コマ純度は高い" },

  // ═══ 感動・エッセイ・仕事 ═══
  { xHandle: "fukaya91", name: "深谷かほる", genre: "感動", followers: 73300, note: "『夜廻り猫』手塚治虫文化賞短編賞・NHKアニメ化。X発4コマで文化賞＝ポータルの権威付けになる" },
  { xHandle: "rosia29", name: "カレー沢薫", genre: "エッセイ", followers: 54200, note: "くらげバンチ『理解のない夫くん』2026/5新連載。文章力もあり企画に絡めやすい" },
  { xHandle: "outesama", name: "ごまきち", genre: "エッセイ", followers: 10000, note: "現役鷹匠。『鷹の師匠、狩りのお時間です！』鷹狩りエッセイ4コマ。題材が唯一無二" },
  { xHandle: "azami", name: "アザミユウコ", genre: "エッセイ", followers: 0, note: "ツイ4『白熱日本酒教室』全3巻。2026年もCOMITIA参加＝現役。フォロワー数未確認" },
  { xHandle: "abhachi_graphic", name: "橋本ナオキ", genre: "仕事あるある", followers: 0, note: "『会社員でぶどり』『毎日でぶどり』。SNS発「プロ社畜」4コマで書籍化。拡散力が強い。フォロワー数未確認" },
  { xHandle: "waiko084", name: "雪わいこ", genre: "エッセイ", followers: 254000, note: "FANBOX運営、投稿頻度が最高水準(3,982件)。旧データの名前「わいこ」は不完全。4コマ主体かは未確認" },
  { xHandle: "ringooooooooooz", name: "アーノルズはせがわ", genre: "エッセイ", followers: 274000, note: "日常ネタ・企業タイアップ。最新2026-06-03。4コマ主体かは未確認" },
  { xHandle: "sankakujougi", name: "若林稔弥", genre: "日常", followers: 337000, note: "『幸せカナコの殺し屋生活』『ぱちん娘。』連載中、『徒然チルドレン』アニメ化。フォロワーは出典間で28.4万〜34.9万と乖離＝目安" },
  { xHandle: "bakanoakachan", name: "地球のお魚ぽんちゃん", genre: "ギャグ", followers: 276000, note: "『霧尾ファンクラブ』2026年4-6月TVアニメ化。『サボり先輩』オモコロ連載。★旧データは作品名「サボり先輩」を人名と誤記。4コマ主体かは未確認" },

  // ═══ 要生存確認 ═══
  { xHandle: "inunonekochan", name: "ちとせ", genre: "猫", followers: 162000, note: "★要生存確認：漫画投稿が2025-12で約7ヶ月の空白。旧データの名前「いとを」は誤り、フォロワーも5倍差" },
  { xHandle: "sunny3san3", name: "KANA", genre: "ギャグ", followers: 49417, note: "★要生存確認：『女の友情と筋肉』全8巻で完結・2024年ミュージカル化。ツイコミに著者ページ無し、活動状況が確認できず。米ポートランド在住" },

  // ═══ 追加調査で4コマ確定（2026-07-17）═══
  { xHandle: "l_palpa", name: "ぱるぱーる", genre: "猫", followers: 0, note: "【4コマ確定】『ねこ漫画ナノトクラス』。4コマ漫画ブログランキング1位、書籍化あり。毎週火・金20時更新。フォロワー数未確認" },
  { xHandle: "yupoko17", name: "よしだゆうこ", genre: "育児", followers: 5712, note: "【4コマ確定】マイナビニュース『息子が大きくなりまして』全118回完結→後継連載開始。記事に毎回【4コマ漫画】と明記" },
  { xHandle: "pinapapinapa", name: "ぴなぱ", genre: "育児", followers: 0, note: "【4コマ確定】ブログ『猫の手貸して』で3姉妹の日々を4コマ連載、ウーマンエキサイト連載。フォロワー数未確認(IG2万超)" },
  { xHandle: "chupeful___life", name: "ちゅーぴふるライフ", genre: "育児", followers: 0, note: "【4コマ確定】アカウント名に「育児4コマ漫画」を明記。原作=大浦力/作画=妻の夫婦制作。パパ視点の4コマは希少。毎週水曜更新" },
  { xHandle: "kurata_kei", name: "倉田けい", genre: "育児", followers: 116000, note: "『マンガおうち理科』等、CHANTO WEB連載。2026-07も毎日級で活動＝活動量とフォロワーは理想的。★4コマ形式かは未確認" },
  { xHandle: "nyanyavo", name: "simico", genre: "猫", followers: 13322, note: "『しみことトモヱ 猫がいるから大丈夫』(イースト・プレス)。ブログほぼ毎日更新。★4コマ形式かは未確認(エッセイ寄り)" },
];

async function main() {
  console.log(`候補 ${creators.length}件 を投入します...`);
  let created = 0;
  let updated = 0;

  for (const c of creators) {
    const existing = await prisma.creatorOutreach.findUnique({
      where: { xHandle: c.xHandle },
    });
    if (existing) {
      // 手動で進めたステータス（DM送信済など）は巻き戻さない
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

  console.log(`新規 ${created}件 / 更新 ${updated}件 / 合計 ${await prisma.creatorOutreach.count()}件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
