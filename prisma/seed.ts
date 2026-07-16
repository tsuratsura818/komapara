import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const GENRES = [
  { name: "日常", slug: "nichijou", emoji: "☀️" },
  { name: "ギャグ", slug: "gag", emoji: "😂" },
  { name: "育児", slug: "ikuji", emoji: "👶" },
  { name: "猫", slug: "neko", emoji: "🐱" },
  { name: "仕事あるある", slug: "shigoto", emoji: "💼" },
  { name: "恋愛", slug: "renai", emoji: "💕" },
  { name: "感動", slug: "kando", emoji: "😢" },
  { name: "エッセイ", slug: "essay", emoji: "✏️" },
];

// プレースホルダー画像（色付きサンプル用）
const COLORS = [
  { bg: "EFF6FF", fg: "3B82F6" },
  { bg: "FEF3C7", fg: "D97706" },
  { bg: "FCE7F3", fg: "DB2777" },
  { bg: "ECFDF5", fg: "059669" },
  { bg: "EDE9FE", fg: "7C3AED" },
  { bg: "FFF7ED", fg: "EA580C" },
];

function panelUrl(color: { bg: string; fg: string }, text: string) {
  return `https://placehold.co/800x800/${color.bg}/${color.fg}/png?text=${encodeURIComponent(text)}`;
}

const SAMPLE_AUTHORS = [
  { name: "サンプル作家", email: "sample@komapara.example", bio: "4コマ漫画を描いています。日常のちょっとした面白さを切り取ります。" },
  { name: "ねこまる", email: "nekomaru@komapara.example", bio: "猫と暮らす日常を4コマにしています。" },
  { name: "たなか", email: "tanaka@komapara.example", bio: "会社員の悲哀を描く4コマ作家。" },
  { name: "ゆきの", email: "yukino@komapara.example", bio: "恋愛ものが得意です。キュンとする4コマをお届けします。" },
  { name: "パパさん", email: "papasan@komapara.example", bio: "2児のパパ。育児の笑いと涙を4コマに。" },
];

const SAMPLE_WORKS = [
  // --- 作家1: サンプル作家 ---
  { title: "月曜日の朝あるある", description: "毎週月曜に繰り返される悲劇", genres: ["nichijou", "shigoto"], authorIdx: 0, likeCount: 42, viewCount: 350, colorIdx: 0 },
  { title: "深夜のコンビニにて", description: "深夜テンションで起きた出来事", genres: ["gag", "nichijou"], authorIdx: 0, likeCount: 78, viewCount: 530, colorIdx: 1 },
  { title: "雨の日の通勤", description: "傘を忘れた日に限って大雨", genres: ["nichijou", "shigoto"], authorIdx: 0, likeCount: 35, viewCount: 280, colorIdx: 2 },
  { title: "休日の二度寝", description: "目覚ましを止めてからが本番", genres: ["nichijou", "gag"], authorIdx: 0, likeCount: 90, viewCount: 720, colorIdx: 3 },
  { title: "自販機の罠", description: "お目当てのドリンクが売り切れ", genres: ["gag", "nichijou"], authorIdx: 0, likeCount: 55, viewCount: 410, colorIdx: 4 },
  { title: "お昼のチャイム", description: "昼休みが待ち遠しすぎる件", genres: ["shigoto", "gag"], authorIdx: 0, likeCount: 62, viewCount: 480, colorIdx: 5 },

  // --- 作家2: ねこまる ---
  { title: "うちの猫が可愛すぎる件", description: "毎日の猫との暮らし", genres: ["neko", "nichijou"], authorIdx: 1, likeCount: 128, viewCount: 890, colorIdx: 1 },
  { title: "猫と段ボール", description: "なぜか段ボールが大好きなうちの猫", genres: ["neko", "gag"], authorIdx: 1, likeCount: 156, viewCount: 1100, colorIdx: 2 },
  { title: "猫の朝ごはん催促", description: "毎朝5時に起こされる話", genres: ["neko", "nichijou"], authorIdx: 1, likeCount: 200, viewCount: 1400, colorIdx: 3 },
  { title: "猫のツンデレ", description: "構ってほしいのに素っ気ない", genres: ["neko", "kando"], authorIdx: 1, likeCount: 175, viewCount: 1250, colorIdx: 4 },
  { title: "猫と掃除機", description: "掃除機に立ち向かう勇者", genres: ["neko", "gag"], authorIdx: 1, likeCount: 140, viewCount: 980, colorIdx: 5 },
  { title: "猫のお気に入りスポット", description: "そこにいるの？という場所で寝る猫", genres: ["neko", "essay"], authorIdx: 1, likeCount: 110, viewCount: 800, colorIdx: 0 },

  // --- 作家3: たなか ---
  { title: "会議中のあるある", description: "誰もが経験するあの瞬間", genres: ["shigoto", "gag"], authorIdx: 2, likeCount: 95, viewCount: 600, colorIdx: 2 },
  { title: "上司の一言", description: "「それ、今日中にお願い」の破壊力", genres: ["shigoto", "gag"], authorIdx: 2, likeCount: 120, viewCount: 850, colorIdx: 3 },
  { title: "リモートワークの現実", description: "カメラOFFの裏側", genres: ["shigoto", "nichijou"], authorIdx: 2, likeCount: 88, viewCount: 620, colorIdx: 4 },
  { title: "金曜日の解放感", description: "週末が見えてきたあの瞬間", genres: ["shigoto", "nichijou"], authorIdx: 2, likeCount: 105, viewCount: 750, colorIdx: 5 },
  { title: "エレベーターの気まずさ", description: "上司と二人きりの30秒", genres: ["shigoto", "gag"], authorIdx: 2, likeCount: 72, viewCount: 510, colorIdx: 0 },
  { title: "社食の謎メニュー", description: "チャレンジ精神が試される昼食", genres: ["shigoto", "gag"], authorIdx: 2, likeCount: 83, viewCount: 580, colorIdx: 1 },

  // --- 作家4: ゆきの ---
  { title: "片思いの距離感", description: "近いようで遠い、あの人との距離", genres: ["renai", "kando"], authorIdx: 3, likeCount: 210, viewCount: 1500, colorIdx: 3 },
  { title: "告白の前日", description: "明日こそ伝えようと思った夜", genres: ["renai", "kando"], authorIdx: 3, likeCount: 230, viewCount: 1650, colorIdx: 4 },
  { title: "相合傘", description: "突然の雨が距離を縮めた", genres: ["renai", "nichijou"], authorIdx: 3, likeCount: 180, viewCount: 1300, colorIdx: 5 },
  { title: "LINEの既読", description: "既読がついてからの3分間が永遠", genres: ["renai", "gag"], authorIdx: 3, likeCount: 195, viewCount: 1400, colorIdx: 0 },
  { title: "初デート", description: "緊張しすぎて記憶がない", genres: ["renai", "gag"], authorIdx: 3, likeCount: 165, viewCount: 1200, colorIdx: 1 },
  { title: "好きな人の隣の席", description: "席替えの奇跡", genres: ["renai", "kando"], authorIdx: 3, likeCount: 250, viewCount: 1800, colorIdx: 2 },

  // --- 作家5: パパさん ---
  { title: "初めての育児日記", description: "新米パパの奮闘記", genres: ["ikuji", "essay"], authorIdx: 4, likeCount: 65, viewCount: 420, colorIdx: 4 },
  { title: "夜泣き対応マニュアル", description: "深夜3時のパパの戦い", genres: ["ikuji", "kando"], authorIdx: 4, likeCount: 98, viewCount: 700, colorIdx: 5 },
  { title: "離乳食の洗礼", description: "顔中ベタベタの食事タイム", genres: ["ikuji", "gag"], authorIdx: 4, likeCount: 75, viewCount: 520, colorIdx: 0 },
  { title: "パパの抱っこ拒否", description: "ママじゃなきゃダメな時期", genres: ["ikuji", "kando"], authorIdx: 4, likeCount: 115, viewCount: 810, colorIdx: 1 },
  { title: "公園デビュー", description: "他のパパママとの距離感", genres: ["ikuji", "nichijou"], authorIdx: 4, likeCount: 58, viewCount: 380, colorIdx: 2 },
  { title: "子どもの寝顔", description: "全てが報われる瞬間", genres: ["ikuji", "kando"], authorIdx: 4, likeCount: 300, viewCount: 2100, colorIdx: 3 },
];

async function main() {
  console.log("Seeding genres...");
  for (const genre of GENRES) {
    await prisma.tag.upsert({
      where: { slug: genre.slug },
      update: { name: genre.name, emoji: genre.emoji },
      create: genre,
    });
  }
  console.log(`Seeded ${GENRES.length} genres.`);

  // サンプルユーザー作成
  console.log("Seeding sample authors...");
  const authors = [];
  for (const author of SAMPLE_AUTHORS) {
    const user = await prisma.user.upsert({
      where: { email: author.email },
      update: {},
      create: {
        name: author.name,
        email: author.email,
        isCreator: true,
        bio: author.bio,
      },
    });
    authors.push(user);
  }
  console.log(`Seeded ${authors.length} authors.`);

  // サンプル作品作成
  console.log("Seeding sample works...");
  let created = 0;
  for (const work of SAMPLE_WORKS) {
    const author = authors[work.authorIdx];
    const existing = await prisma.work.findFirst({
      where: { title: work.title, authorId: author.id },
    });
    if (existing) continue;

    const color = COLORS[work.colorIdx % COLORS.length];
    await prisma.work.create({
      data: {
        title: work.title,
        description: work.description,
        panels: [
          panelUrl(color, `${work.title.slice(0, 4)} 1コマ`),
          panelUrl(color, `${work.title.slice(0, 4)} 2コマ`),
          panelUrl(color, `${work.title.slice(0, 4)} 3コマ`),
          panelUrl(color, `${work.title.slice(0, 4)} 4コマ`),
        ],
        authorId: author.id,
        likeCount: work.likeCount,
        viewCount: work.viewCount,
        tags: {
          connect: work.genres.map((slug) => ({ slug })),
        },
      },
    });
    created++;
  }
  console.log(`Seeded ${created} new works (${SAMPLE_WORKS.length} total).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
