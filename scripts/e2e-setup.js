// 決済E2E用のセットアップ。テスト専用ユーザーとログインセッションを作り、
// 投げ銭の対象（アオンの作品）を選ぶ。テスト後に e2e-teardown.js で完全削除する。
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

const TEST_EMAIL = "e2e-payment-test@komapara.local";

async function main() {
  // 投げ銭の受け手＝アオン（作品の作者）。テストユーザーとは別人でないと投げ銭できない
  const aon = await prisma.user.findFirst({
    where: { OR: [{ name: { contains: "アオン" } }, { name: { contains: "おくり狼" } }] },
    select: { id: true, name: true },
  });
  if (!aon) throw new Error("アオンのユーザーが見つからない");

  const work = await prisma.work.findFirst({
    where: { authorId: aon.id, isPublished: true },
    select: { id: true, title: true, tipTotal: true },
  });
  if (!work) throw new Error("アオンの公開作品が見つからない");

  // テスト専用ユーザー（投げ銭する側）
  const tester = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: {},
    create: { email: TEST_EMAIL, name: "E2E決済テスター" },
    select: { id: true },
  });

  // 既存のテストセッションを掃除してから新規作成
  await prisma.session.deleteMany({ where: { userId: tester.id } });
  const sessionToken = crypto.randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      sessionToken,
      userId: tester.id,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const out = {
    sessionToken,
    testerId: tester.id,
    aonId: aon.id,
    aonName: aon.name,
    workId: work.id,
    workTitle: work.title,
    workTipTotalBefore: work.tipTotal,
  };
  require("fs").writeFileSync(
    require("path").join(__dirname, "../.e2e-state.json"),
    JSON.stringify(out, null, 2)
  );
  console.log("セットアップ完了:");
  console.log("  対象作品:", out.workTitle, "(" + out.workId + ")");
  console.log("  受け手:", out.aonName);
  console.log("  投げ銭前 tipTotal:", out.workTipTotalBefore);
  console.log("  sessionToken: " + sessionToken.slice(0, 10) + "...(保存済み)");
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
