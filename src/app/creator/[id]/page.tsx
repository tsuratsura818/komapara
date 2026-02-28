import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WorkCard } from "@/components/works/WorkCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FollowButton } from "@/components/auth/FollowButton";
import { SubscribeButton } from "@/components/subscriptions/SubscribeButton";

export const revalidate = 1800;

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  if (!user) return { title: "作家が見つかりません" };
  return { title: `${user.name}の作品` };
}

export default async function CreatorPage({ params }: Props) {
  const session = await auth();

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

  const [tipStats, subPlans, subscriberCount, subSetting] = await Promise.all([
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
  ]);
  const subscriptionsEnabled = subSetting?.value !== "false";

  let isFollowing = false;
  let currentSubscription = null as { id: string; status: string; plan: { name: string; price: number } } | null;
  if (session?.user?.id && session.user.id !== user.id) {
    const [follow, sub] = await Promise.all([
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: user.id,
          },
        },
      }),
      prisma.subscription.findUnique({
        where: {
          subscriberId_creatorId: {
            subscriberId: session.user.id,
            creatorId: user.id,
          },
        },
        include: { plan: { select: { name: true, price: true } } },
      }).catch(() => null),
    ]);
    isFollowing = !!follow;
    if (sub && sub.status === "active") {
      currentSubscription = { id: sub.id, status: sub.status, plan: sub.plan };
    }
  }

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
            <div className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-600 text-2xl font-bold">
              {user.name?.[0] || "?"}
            </div>
          )}

          {session?.user?.id !== user.id && session && (
            <div className="mb-1">
              <FollowButton userId={user.id} initialFollowing={isFollowing} />
            </div>
          )}
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
              <strong className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {(tipStats._sum.amount || 0).toLocaleString()}円
              </strong>{" "}
              投げ銭
            </span>
          )}
          {subscriberCount > 0 && (
            <span>
              <strong className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
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
                  <p className="text-lg font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
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
              currentSubscription={currentSubscription}
              subscriptionsEnabled={subscriptionsEnabled}
            />
          </div>
        )}
      </div>

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
