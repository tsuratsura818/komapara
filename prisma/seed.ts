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

// プレースホルダー画像（サンプル用）
const PANEL_PLACEHOLDER = "https://placehold.co/800x800/EFF6FF/3B82F6?text=";

const SAMPLE_WORKS = [
  {
    title: "月曜日の朝あるある",
    description: "毎週月曜に繰り返される悲劇",
    genres: ["nichijou", "shigoto"],
    panels: [
      `${PANEL_PLACEHOLDER}1%E3%82%B3%E3%83%9E`,
      `${PANEL_PLACEHOLDER}2%E3%82%B3%E3%83%9E`,
      `${PANEL_PLACEHOLDER}3%E3%82%B3%E3%83%9E`,
      `${PANEL_PLACEHOLDER}4%E3%82%B3%E3%83%9E`,
    ],
    likeCount: 42,
    viewCount: 350,
  },
  {
    title: "うちの猫が可愛すぎる件",
    description: "毎日の猫との暮らし",
    genres: ["neko", "nichijou"],
    panels: [
      `${PANEL_PLACEHOLDER}Panel+1`,
      `${PANEL_PLACEHOLDER}Panel+2`,
      `${PANEL_PLACEHOLDER}Panel+3`,
      `${PANEL_PLACEHOLDER}Panel+4`,
    ],
    likeCount: 128,
    viewCount: 890,
  },
  {
    title: "初めての育児日記",
    description: "新米パパの奮闘記",
    genres: ["ikuji", "essay"],
    panels: [
      `${PANEL_PLACEHOLDER}1`,
      `${PANEL_PLACEHOLDER}2`,
      `${PANEL_PLACEHOLDER}3`,
      `${PANEL_PLACEHOLDER}4`,
    ],
    likeCount: 65,
    viewCount: 420,
  },
  {
    title: "片思いの距離感",
    description: "近いようで遠い、あの人との距離",
    genres: ["renai", "kando"],
    panels: [
      `${PANEL_PLACEHOLDER}A`,
      `${PANEL_PLACEHOLDER}B`,
      `${PANEL_PLACEHOLDER}C`,
      `${PANEL_PLACEHOLDER}D`,
    ],
    likeCount: 210,
    viewCount: 1500,
  },
  {
    title: "会議中のあるある",
    description: "誰もが経験するあの瞬間",
    genres: ["shigoto", "gag"],
    panels: [
      `${PANEL_PLACEHOLDER}Start`,
      `${PANEL_PLACEHOLDER}Middle1`,
      `${PANEL_PLACEHOLDER}Middle2`,
      `${PANEL_PLACEHOLDER}End`,
    ],
    likeCount: 95,
    viewCount: 600,
  },
  {
    title: "深夜のコンビニにて",
    description: "深夜テンションで起きた出来事",
    genres: ["gag", "nichijou"],
    panels: [
      `${PANEL_PLACEHOLDER}Scene+1`,
      `${PANEL_PLACEHOLDER}Scene+2`,
      `${PANEL_PLACEHOLDER}Scene+3`,
      `${PANEL_PLACEHOLDER}Scene+4`,
    ],
    likeCount: 78,
    viewCount: 530,
  },
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
  console.log("Seeding sample user...");
  const sampleUser = await prisma.user.upsert({
    where: { email: "sample@komapara.example" },
    update: {},
    create: {
      name: "サンプル作家",
      email: "sample@komapara.example",
      isCreator: true,
      bio: "4コマ漫画を描いています。日常のちょっとした面白さを切り取ります。",
    },
  });

  // サンプル作品作成
  console.log("Seeding sample works...");
  for (const work of SAMPLE_WORKS) {
    const existing = await prisma.work.findFirst({
      where: { title: work.title, authorId: sampleUser.id },
    });
    if (existing) continue;

    await prisma.work.create({
      data: {
        title: work.title,
        description: work.description,
        panels: work.panels,
        authorId: sampleUser.id,
        likeCount: work.likeCount,
        viewCount: work.viewCount,
        tags: {
          connect: work.genres.map((slug) => ({ slug })),
        },
      },
    });
  }
  console.log(`Seeded ${SAMPLE_WORKS.length} sample works.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
