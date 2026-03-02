import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardWorkCard } from "@/components/works/DashboardWorkCard";
import { PlanManager } from "@/components/subscriptions/PlanManager";
import { XSyncPanel } from "@/components/works/XSyncPanel";
import { SeriesManager } from "@/components/series/SeriesManager";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "ダッシュボード",
};

const STAT_STYLES = [
  { gradient: "from-purple-500 to-blue-500" },
  { gradient: "from-blue-500 to-cyan-500" },
  { gradient: "from-pink-500 to-red-500" },
  { gradient: "from-orange-500 to-yellow-500" },
  { gradient: "from-yellow-400 to-orange-500" },
  { gradient: "from-purple-400 to-indigo-500" },
  { gradient: "from-indigo-400 to-blue-500" },
];

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      works: {
        include: {
          tags: { select: { name: true, slug: true, emoji: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { followers: true, following: true },
      },
    },
  });

  if (!user) redirect("/login");

  const [tipStats, subStats, subPlans, subSetting, userSeries] = await Promise.all([
    prisma.tip.aggregate({
      where: { receiverId: session.user.id, paymentStatus: "completed" },
      _sum: { netAmount: true },
      _count: true,
    }).catch(() => ({ _sum: { netAmount: 0 }, _count: 0 })),
    prisma.subscription.aggregate({
      where: { creatorId: session.user.id, paymentStatus: "completed" },
      _sum: { netAmount: true },
      _count: true,
    }).catch(() => ({ _sum: { netAmount: 0 }, _count: 0 })),
    prisma.subscriptionPlan.findMany({
      where: { creatorId: session.user.id },
      orderBy: { price: "asc" },
      include: { _count: { select: { subscriptions: { where: { status: "active" } } } } },
    }).catch(() => []),
    prisma.siteSetting.findUnique({ where: { key: "subscriptions_enabled" } }).catch(() => null),
    prisma.series.findMany({
      where: { authorId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        works: {
          orderBy: { seriesOrder: "asc" },
          select: { id: true, title: true, panels: true, seriesOrder: true },
        },
      },
    }).catch(() => []),
  ]);
  const subscriptionsEnabled = subSetting?.value !== "false";

  const totalViews = user.works.reduce((sum, w) => sum + w.viewCount, 0);
  const totalLikes = user.works.reduce((sum, w) => sum + w.likeCount, 0);

  const stats = [
    { label: "作品数", value: user.works.length },
    { label: "総閲覧数", value: totalViews },
    { label: "総いいね", value: totalLikes },
    { label: "フォロワー", value: user._count.followers },
    { label: "投げ銭収益", value: `${(tipStats._sum.netAmount || 0).toLocaleString()}円` },
    ...(subscriptionsEnabled ? [
      { label: "サブスク収益", value: `${(subStats._sum.netAmount || 0).toLocaleString()}円` },
      { label: "購読者数", value: subStats._count },
    ] : []),
  ];

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold gradient-text mb-6">ダッシュボード</h1>

      {/* 統計 */}
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(stats.length, 7)} gap-3 mb-6`}>
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 text-center relative overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${STAT_STYLES[i].gradient} opacity-5`}
            />
            <p
              className={`text-2xl font-bold relative bg-gradient-to-r ${STAT_STYLES[i].gradient} bg-clip-text text-transparent`}
            >
              {stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-komapara-muted mt-1 relative">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* サブスクリプションプラン管理 */}
      {subscriptionsEnabled && (
        <div className="mb-6">
          <PlanManager initialPlans={subPlans} />
        </div>
      )}

      {/* シリーズ管理 */}
      <div className="mb-6">
        <SeriesManager
          initialSeries={userSeries}
          userWorks={user.works.map((w) => ({
            id: w.id,
            title: w.title,
            panels: w.panels,
            seriesId: w.seriesId,
          }))}
        />
      </div>

      {/* X同期 */}
      <div className="mb-6">
        <XSyncPanel />
      </div>

      {/* 自分の作品 */}
      <h2 className="text-sm font-semibold gradient-text mb-3">あなたの作品</h2>
      {user.works.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {user.works.map((work) => (
            <DashboardWorkCard
              key={work.id}
              id={work.id}
              title={work.title}
              description={work.description}
              panels={work.panels}
              author={{
                id: user.id,
                name: user.name,
                image: user.image,
              }}
              genres={work.tags}
              likeCount={work.likeCount}
              createdAt={work.createdAt.toISOString()}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-komapara-muted glass rounded-xl">
          <p>まだ作品がありません</p>
          <Link
            href="/upload"
            className="inline-block mt-3 px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            最初の4コマを投稿する
          </Link>
        </div>
      )}
    </div>
  );
}
