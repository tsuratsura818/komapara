import { prisma } from "@/lib/prisma";
import { highResAvatar } from "@/lib/utils";
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
              src={highResAvatar(user.image) as string}
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
        {user.bio && (
          <p className="text-sm text-komapara-text mt-1">{user.bio}</p>
        )}

        {/* SNS導線（設定されているものだけ出す） */}
        {(user.xHandle || user.instagramHandle || user.websiteUrl) && (
          <div className="flex items-center gap-3 mt-2">
            {user.xHandle && (
              <a
                href={`https://x.com/${user.xHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-komapara-muted hover:text-komapara-text transition-colors"
                aria-label={`Xで${user.name}を見る`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            )}
            {user.instagramHandle && (
              <a
                href={`https://instagram.com/${user.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-komapara-muted hover:text-komapara-text transition-colors"
                aria-label={`Instagramで${user.name}を見る`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            )}
            {user.websiteUrl && (
              <a
                href={user.websiteUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-komapara-muted hover:text-komapara-text transition-colors"
                aria-label={`${user.name}のサイトを見る`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />
                </svg>
              </a>
            )}
          </div>
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
