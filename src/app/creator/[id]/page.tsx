import { prisma } from "@/lib/prisma";
import { WorkCard } from "@/components/works/WorkCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FollowButton } from "@/components/auth/FollowButton";
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton";

// 公開の作家ページ（フォロー/購読状態はクライアントが自己フェッチ）。ISRで配信
export const revalidate = 1800;

// 動的セグメントをオンデマンドISR化
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  if (!user) return { title: "作家が見つかりません" };
  return { title: `${user.name}の作品` };
}

export default async function CreatorPage(props: Props) {
  const params = await props.params;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      works: {
        where: { isPublished: true },
        include: {
          tags: { select: { name: true, slug: true, emoji: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          followers: true,
          works: { where: { isPublished: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const [tipStats, subPlans, subscriberCount, subSetting, creatorSeries] = await Promise.all([
    prisma.tip.aggregate({
      where: { receiverId: params.id, paymentStatus: "completed" },
      _sum: { amount: true },
      _count: true,
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
    prisma.subscriptionPlan.findMany({
      where: { creatorId: params.id, isActive: true },
      orderBy: { price: "asc" },
    }).catch(() => []),
    prisma.subscription.count({
      where: { creatorId: params.id, status: "active" },
    }).catch(() => 0),
    prisma.siteSetting.findUnique({ where: { key: "subscriptions_enabled" } }).catch(() => null),
    prisma.series.findMany({
      where: { authorId: params.id },
      orderBy: { updatedAt: "desc" },
      include: {
        works: {
          where: { isPublished: true },
          orderBy: { seriesOrder: "asc" },
          select: { id: true, panels: true, likeCount: true },
        },
        _count: { select: { works: { where: { isPublished: true } } } },
      },
    }).catch(() => []),
  ]);
  const subscriptionsEnabled = subSetting?.value !== "false";
  // フォロー/購読の個別状態は FollowButton / SubscribeButton がクライアントで自己取得する

  return (
    <div>
      {/* Profile gradient banner */}
      <div className="h-24 bg-gradient-main rounded-b-2xl" />

      <div className="px-4 -mt-10">
        {/* プロフィール */}
        <div className="flex items-end gap-4 mb-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || ""}
              className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg"
            />
          ) : (
            <div className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg bg-linear-to-br from-blue-100 to-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
              {user.name?.[0] || "?"}
            </div>
          )}

          {/* FollowButton は自身でセッション/自作品を判定し表示制御する */}
          <div className="mb-1">
            <FollowButton userId={user.id} />
          </div>
        </div>

        <h1 className="text-lg font-bold text-komapara-text">{user.name}</h1>
        {user.xHandle && (
          <p className="text-sm text-komapara-muted">@{user.xHandle}</p>
        )}
        {user.bio && (
          <p className="text-sm text-komapara-text mt-1">{user.bio}</p>
        )}

        <div className="flex gap-4 mt-2 text-sm text-komapara-muted">
          <span>
            <strong className="gradient-text">{user._count.works}</strong> 作品
          </span>
          <span>
            <strong className="gradient-text">{user._count.followers}</strong>{" "}
            フォロワー
          </span>
          {(tipStats._sum.amount || 0) > 0 && (
            <span>
              <strong className="bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {(tipStats._sum.amount || 0).toLocaleString()}円
              </strong>{" "}
              投げ銭
            </span>
          )}
          {subscriberCount > 0 && (
            <span>
              <strong className="bg-linear-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent">
                {subscriberCount}
              </strong>{" "}
              購読者
            </span>
          )}
        </div>

        {/* サブスクリプションプラン */}
        {subscriptionsEnabled && subPlans.length > 0 && (
          <div className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              {subPlans.map((plan) => (
                <div key={plan.id} className="glass rounded-xl p-3">
                  <p className="text-sm font-medium text-komapara-text">{plan.name}</p>
                  <p className="text-lg font-bold bg-linear-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent">
                    {plan.price.toLocaleString()}円/月
                  </p>
                  {plan.description && (
                    <p className="text-xs text-komapara-muted mt-1">{plan.description}</p>
                  )}
                </div>
              ))}
            </div>
            <SubscribeButton
              creatorId={user.id}
              creatorName={user.name}
              plans={subPlans}
              subscriptionsEnabled={subscriptionsEnabled}
            />
          </div>
        )}
      </div>

      {/* シリーズ一覧 */}
      {creatorSeries.length > 0 && (
        <div className="px-4 mt-6 border-t border-komapara-border/50 pt-4">
          <h2 className="text-sm font-semibold gradient-text mb-3">
            シリーズ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {creatorSeries.map((series) => {
              const cover = series.works[0]?.panels[0];
              const totalLikes = series.works.reduce((sum: number, w: { likeCount: number }) => sum + w.likeCount, 0);
              return (
                <a
                  key={series.id}
                  href={`/series/${series.id}`}
                  className="flex gap-3 p-3 glass rounded-xl hover:bg-white/10 transition-colors"
                >
                  {cover ? (
                    <img
                      src={cover}
                      alt={series.title}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-linear-to-br from-blue-100 to-blue-100 shrink-0 flex items-center justify-center text-blue-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-komapara-text truncate">
                      {series.title}
                    </p>
                    <div className="flex gap-2 mt-1 text-[10px] text-komapara-muted">
                      <span>{series._count.works}話</span>
                      <span>{totalLikes} いいね</span>
                      {series.isCompleted && (
                        <span className="text-green-600">完結</span>
                      )}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* 作品一覧 */}
      <div className="px-4 mt-6 border-t border-komapara-border/50 pt-4">
        <h2 className="text-sm font-semibold gradient-text mb-3">
          作品 ({user._count.works})
        </h2>

        {user.works.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {user.works.map((work) => (
              <div
                key={work.id}
              >
                <WorkCard
                  id={work.id}
                  title={work.title}
                  panels={work.panels}
                  author={{ id: user.id, name: user.name, image: user.image }}
                  genres={work.tags}
                  likeCount={work.likeCount}
                  createdAt={work.createdAt.toISOString()}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-10 text-komapara-muted">
            まだ作品がありません
          </p>
        )}
      </div>
    </div>
  );
}
