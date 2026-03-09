import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CreatorData {
  xHandle: string;
  name: string;
  genre: string;
  followers: number;
  note: string;
}

const creators: CreatorData[] = [
  // === 4コマ漫画・ギャグ系 ===
  { xHandle: "ruru_ie", name: "留々家", genre: "日常", followers: 30000, note: "4コマで6.7万いいね実績、1時間4コマ企画主催" },
  { xHandle: "sekino4koma", name: "せきの", genre: "日常", followers: 10000, note: "4コマ専門で定期投稿" },
  { xHandle: "sobomiyako98", name: "きよまろ", genre: "日常", followers: 12100, note: "芳文社新人賞受賞、「祖母みや子100歳」KADOKAWA電子書籍" },
  { xHandle: "tunatu727", name: "津夏なつな", genre: "ギャグ", followers: 8000, note: "毎日投稿、シュール・ダークコメディ" },
  { xHandle: "period_apos", name: "ゴードン松坂", genre: "ギャグ", followers: 5000, note: "「ずんどこどっかんぼん」1000本以上投稿" },
  { xHandle: "bakanoakachan", name: "サボり先輩", genre: "ギャグ", followers: 60000, note: "プロ漫画家、Twitter発ギャグ漫画" },
  { xHandle: "sahoobb", name: "山本さほ", genre: "エッセイ", followers: 70000, note: "脱サラ漫画家、独自視点の日常エッセイ" },
  { xHandle: "OLtaeko", name: "そろそろ谷川", genre: "日常", followers: 110000, note: "「耐え子の日常」書籍化・アニメ化、OL日常" },
  { xHandle: "hikaru_illust", name: "田中光", genre: "ギャグ", followers: 300000, note: "「サラリーマン山崎シゲル」お笑い芸人兼漫画家" },
  { xHandle: "ringooooooooooz", name: "アーノルズはせがわ", genre: "エッセイ", followers: 226000, note: "web4コマ・エッセイ漫画" },
  { xHandle: "ohoshintaro", name: "おほしんたろう", genre: "ギャグ", followers: 175000, note: "佐賀県出身お笑い芸人、味のある1コマ漫画" },

  // === ツイ4（最前線）掲載作家 ===
  { xHandle: "sankakujougi", name: "若林稔弥", genre: "日常", followers: 80000, note: "「幸せカナコの殺し屋生活」「徒然チルドレン」アニメ化" },
  { xHandle: "sunny3san3", name: "KANA", genre: "ギャグ", followers: 20000, note: "「女の友情と筋肉」累計54万部、ミュージカル化" },
  { xHandle: "choboraunyopomi", name: "ちょぼらうにょぽみ", genre: "ギャグ", followers: 80000, note: "「あいまいみー」アニメ化、唯一無二のシュールギャグ" },

  // === 育児漫画系 ===
  { xHandle: "SeijiTakanashi", name: "せーじ", genre: "育児", followers: 15000, note: "コミティア参加、同人活動あり" },
  { xHandle: "nikukyupunio", name: "にくきゅうぷにお", genre: "育児", followers: 10000, note: "子どものほっぺのプルプル感が特徴" },
  { xHandle: "yoshikiyun", name: "吉木ゆん", genre: "育児", followers: 8000, note: "「うちのムスメは塩対応」アメブロ連載" },
  { xHandle: "k_i_121", name: "imo-nak", genre: "育児", followers: 5000, note: "姉妹漫画" },
  { xHandle: "miz0re_", name: "みぞれ", genre: "育児", followers: 8000, note: "共感性の高い育児作品" },
  { xHandle: "yan_mugi", name: "つん", genre: "育児", followers: 5000, note: "ユーモア溢れる4コマ" },
  { xHandle: "pusuuuun", name: "ぷすん", genre: "育児", followers: 5000, note: "子どもが親の口調を真似する描写" },
  { xHandle: "sarinkon", name: "さりンコン", genre: "育児", followers: 5000, note: "LINEスタンプも製作" },
  { xHandle: "maetel_arch", name: "メーテル", genre: "育児", followers: 10000, note: "長男・次男の日常、キャラが可愛い" },
  { xHandle: "39baby_com", name: "るしこ", genre: "育児", followers: 50000, note: "息子と夫婦の日常4コマ" },
  { xHandle: "minorikambe", name: "かんべみのり", genre: "育児", followers: 50000, note: "書籍発売中、MBA × 育児 × 漫画" },
  { xHandle: "nonnyakonyako", name: "パパ頭", genre: "育児", followers: 60000, note: "育児（パパ目線）、ほのぼのイラスト、育休体験漫画" },
  { xHandle: "gumamasan1", name: "chiiko", genre: "育児", followers: 50000, note: "ぐっちゃんママ、妊娠〜出産〜夜泣きまで網羅的" },
  { xHandle: "3MshXcteuuT241U", name: "さざなみ", genre: "育児", followers: 20000, note: "育児日常漫画" },
  { xHandle: "katomayumi", name: "加藤マユミ", genre: "育児", followers: 60000, note: "育児エッセイ、夫は漫画家・横山了一" },
  { xHandle: "yokoyama_bancho", name: "横山了一", genre: "育児", followers: 70000, note: "「戦国コミケ」等、育児・ギャグ、妻は加藤マユミ" },
  { xHandle: "tsumugitopan", name: "つむぱぱ", genre: "育児", followers: 60000, note: "育児（パパ目線）、娘つむぎちゃんとの日常" },
  { xHandle: "marige333", name: "まりげ", genre: "育児", followers: 115000, note: "京都移住、古民家暮らし、4兄弟" },
  { xHandle: "mihajlo0011", name: "ミハイロ", genre: "育児", followers: 130000, note: "育児（パパ目線）、双子男児" },
  { xHandle: "suitondiary", name: "いくたはな", genre: "育児", followers: 355000, note: "書籍多数、大手育児漫画家" },

  // === 猫・ペット漫画系 ===
  { xHandle: "msbcmnt2", name: "ますぶちみなと", genre: "猫", followers: 15000, note: "「猫だからしょうがない」毎日22:30-23:00更新、猫4コマ" },
  { xHandle: "bou128", name: "AKR", genre: "猫", followers: 10000, note: "猫の鼻チューコミュニケーション絵日記" },
  { xHandle: "mirumirupakupa1", name: "藤緒ミルカ", genre: "猫", followers: 15000, note: "猫漫画エッセイ、Yahoo!ニュース寄稿" },
  { xHandle: "ameminori", name: "あめみのり", genre: "猫", followers: 10000, note: "猫日常漫画" },
  { xHandle: "vriGOpzvmMRE5Dv", name: "にごたろ", genre: "猫", followers: 30000, note: "噛む猫と2匹の猫漫画" },
  { xHandle: "inunonekochan", name: "ちとせ", genre: "その他", followers: 30000, note: "犬漫画" },
  { xHandle: "yajima_en", name: "やじま", genre: "猫", followers: 60000, note: "「ねこおじ」シリーズ6巻発売中" },
  { xHandle: "Qrais_Usagi", name: "キューライス", genre: "猫", followers: 200000, note: "「ネコノヒー」「スキウサギ」アニメ化" },
  { xHandle: "sobun_nekomanga", name: "湊文", genre: "猫", followers: 155000, note: "「猫の菊ちゃん」書籍化" },
  { xHandle: "TsuyoshiWood", name: "鴻池剛", genre: "猫", followers: 750000, note: "猫エッセイ「ぽんた」75万フォロワー" },
  { xHandle: "hidekiccan", name: "松本ひで吉", genre: "猫", followers: 500000, note: "「犬と猫どっちも飼ってると毎日たのしい」50万部" },
  { xHandle: "kyuryuZ", name: "キュルZ", genre: "猫", followers: 800000, note: "「夜は猫といっしょ」アニメ化、80万+フォロワー" },
  { xHandle: "tsushimacat", name: "俺、つしま", genre: "猫", followers: 300000, note: "「俺、つしま」書籍化・アニメ化" },
  { xHandle: "pandania0", name: "ぱんだにあ", genre: "猫", followers: 200000, note: "「ねこようかい」アニメ化" },

  // === エッセイ・日常・夫婦系 ===
  { xHandle: "waiko084", name: "雪わいこ", genre: "エッセイ", followers: 145000, note: "夫婦模様のエッセイ漫画が人気" },
  { xHandle: "Dekopon_56", name: "でこぽん吾郎", genre: "エッセイ", followers: 100000, note: "「保育士でこ先生」書籍化" },
];

async function main() {
  console.log(`${creators.length}件のクリエイターをシード中...`);

  let created = 0;
  let skipped = 0;

  for (const c of creators) {
    try {
      await prisma.creatorOutreach.upsert({
        where: { xHandle: c.xHandle },
        update: {
          name: c.name,
          genre: c.genre,
          followers: c.followers,
          note: c.note,
        },
        create: {
          xHandle: c.xHandle,
          name: c.name,
          genre: c.genre,
          followers: c.followers,
          status: "候補",
          note: c.note,
        },
      });
      created++;
    } catch (e) {
      console.error(`スキップ: @${c.xHandle} - ${e}`);
      skipped++;
    }
  }

  console.log(`完了: ${created}件追加/更新, ${skipped}件スキップ`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
