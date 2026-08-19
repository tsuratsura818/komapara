// 決済E2Eのテストデータを完全削除して原状復帰する。
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const s = require("../.e2e-state.json");

async function main() {
  const tips = await prisma.tip.deleteMany({ where: { senderId: s.testerId } });
  await prisma.work.update({ where: { id: s.workId }, data: { tipTotal: s.workTipTotalBefore } });
  const subs = await prisma.subscription.deleteMany({ where: { subscriberId: s.testerId } });
  const prem = await prisma.premiumSubscription.deleteMany({ where: { userId: s.testerId } });
  await prisma.session.deleteMany({ where: { userId: s.testerId } });
  if (s.planId) await prisma.subscriptionPlan.delete({ where: { id: s.planId } }).catch(() => {});
  await prisma.user.delete({ where: { id: s.testerId } }).catch(() => {});
  // ★本番決済を壊さないため、テストモードのprice IDキャッシュを削除（本番で再生成される）
  const setting = await prisma.siteSetting.deleteMany({ where: { key: "stripe_premium_price_id" } });
  // テスト由来のwebhook記録を掃除（本番Stripeはまだ未稼働なので全件テスト由来）
  const evt = await prisma.processedWebhookEvent.deleteMany({});

  console.log("削除: Tip", tips.count, "/ Subscription", subs.count, "/ PremiumSub", prem.count);
  console.log("削除: SubscriptionPlan", s.planId ? 1 : 0, "/ testユーザー 1 / stripe_premium_price_id", setting.count);
  console.log("削除: ProcessedWebhookEvent", evt.count);

  // 検証
  const work = await prisma.work.findUnique({ where: { id: s.workId }, select: { tipTotal: true } });
  const userGone = !(await prisma.user.findUnique({ where: { id: s.testerId } }));
  const settingGone = !(await prisma.siteSetting.findUnique({ where: { key: "stripe_premium_price_id" } }));
  const planGone = s.planId ? !(await prisma.subscriptionPlan.findUnique({ where: { id: s.planId } })) : true;
  console.log("\n検証:");
  console.log("  tipTotal 復帰:", work.tipTotal === s.workTipTotalBefore ? "OK(" + work.tipTotal + ")" : "★NG");
  console.log("  testユーザー削除:", userGone ? "OK" : "★NG");
  console.log("  テストプラン削除:", planGone ? "OK" : "★NG");
  console.log("  stripe price ID消去:", settingGone ? "OK" : "★NG");
}

main().catch((e) => { console.error(e.message); process.exit(1); }).finally(() => prisma.$disconnect());
