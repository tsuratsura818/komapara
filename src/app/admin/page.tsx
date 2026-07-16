import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ダッシュボード" };

const STAT_STYLES = [
  { gradient: "from-purple-500 to-blue-500" },
  { gradient: "from-blue-500 to-cyan-500" },
  { gradient: "from-green-500 to-emerald-500" },
  { gradient: "from-pink-500 to-red-500" },
  { gradient: "from-orange-500 to-yellow-500" },
  { gradient: "from-yellow-400 to-orange-500" },
  { gradient: "from-emerald-400 to-green-500" },
];

export default async function AdminDashboardPage() {
  const [userCount, workCount, commentCount, likeCount, viewStats, tipStats, subStats, activeSubCount, premiumStats, activePremiumCount, recentWorks, recentComments, recentTips, recentSubs, recentPremium, tipSetting, subSetting, premiumSetting] =
    await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.work.count().catch(() => 0),
      prisma.comment.count().catch(() => 0),
      prisma.like.count().catch(() => 0),
      prisma.work.aggregate({ _sum: { viewCount: true } }).catch(() => ({ _sum: { viewCount: 0 } })),
      prisma.tip.aggregate({
        where: { paymentStatus: "completed" },
        _sum: { amount: true, platformFee: true },
        _count: true,
      }).catch(() => ({ _sum: { amount: 0, platformFee: 0 }, _count: 0 })),
      prisma.subscription.aggregate({
        where: { paymentStatus: "completed" },
        _sum: { amount: true, platformFee: true },
        _count: true,
      }).catch(() => ({ _sum: { amount: 0, platformFee: 0 }, _count: 0 })),
      prisma.subscription.count({ where: { status: "active" } }).catch(() => 0),
      prisma.premiumSubscription.aggregate({
        where: { paymentStatus: "completed" },
        _sum: { amount: true },
        _count: true,
      }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
      prisma.premiumSubscription.count({ where: { status: "active" } }).catch(() => 0),
      prisma.work.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { author: { select: { id: true, name: true, image: true } } },
      }).catch(() => []),
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { id: true, name: true, image: true } },
          work: { select: { id: true, title: true } },
        },
      }).catch(() => []),
      prisma.tip.findMany({
        where: { paymentStatus: "completed" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          sender: { select: { id: true, name: true, image: true } },
          receiver: { select: { id: true, name: true } },
          work: { select: { id: true, title: true } },
        },
      }).catch(() => []),
      prisma.subscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          subscriber: { select: { id: true, name: true, image: true } },
          creator: { select: { id: true, name: true } },
          plan: { select: { name: true, price: true } },
        },
      }).catch(() => []),
      prisma.premiumSubscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      }).catch(() => []),
      prisma.siteSetting.findUnique({ where: { key: "tips_enabled" } }).catch(() => null),
      prisma.siteSetting.findUnique({ where: { key: "subscriptions_enabled" } }).catch(() => null),
      prisma.siteSetting.findUnique({ where: { key: "premium_enabled" } }).catch(() => null),
    ]);

  const totalPV = viewStats._sum.viewCount || 0;

  const tipAmount = (tipStats as { _sum: { amount: number | null; platformFee: number | null }; _count: number })._sum.amount || 0;
  const tipFee = (tipStats as { _sum: { amount: number | null; platformFee: number | null }; _count: number })._sum.platformFee || 0;
  const tipsEnabled = tipSetting?.value !== "false";
  const subsEnabled = subSetting?.value !== "false";
  const premiumEnabled = premiumSetting?.value !== "false";
  const subAmount = (subStats as { _sum: { amount: number | null; platformFee: number | null }; _count: number })._sum.amount || 0;
  const subFee = (subStats as { _sum: { amount: number | null; platformFee: number | null }; _count: number })._sum.platformFee || 0;
  const premiumAmount = (premiumStats as { _sum: { amount: number | null }; _count: number })._sum.amount || 0;

  const stats = [
    { label: "ユーザー数", value: userCount },
    { label: "作品数", value: workCount },
    { label: "総PV", value: totalPV },
    { label: "総いいね", value: likeCount },
    { label: "コメント数", value: commentCount },
    { label: "投げ銭総額", value: `${tipAmount.toLocaleString()}円` },
    { label: "手数料収入", value: `${tipFee.toLocaleString()}円` },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold gradient-text mb-6">管理ダッシュボード</h1>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 text-center relative overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-linear-to-br ${STAT_STYLES[i].gradient} opacity-5`}
            />
            <p
              className={`text-2xl font-bold relative bg-linear-to-r ${STAT_STYLES[i].gradient} bg-clip-text text-transparent`}
            >
              {stat.value.toLocaleString()}
            </p>
            <p className="text-xs text-komapara-muted mt-1 relative">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* 投げ銭セクション */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold gradient-text">投げ銭</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${tipsEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {tipsEnabled ? "有効" : "無効"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-yellow-50 to-orange-50">
            <p className="text-lg font-bold bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {tipAmount.toLocaleString()}円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">総額</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-emerald-50 to-green-50">
            <p className="text-lg font-bold bg-linear-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              {tipFee.toLocaleString()}円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">手数料収入</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50">
            <p className="text-lg font-bold bg-linear-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              {(tipAmount - tipFee).toLocaleString()}円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">クリエイター還元</p>
          </div>
        </div>
        <div className="space-y-2">
          {recentTips.map((tip) => (
            <div key={tip.id} className="flex items-center gap-3 py-1.5 border-b border-komapara-border/30 last:border-b-0">
              {tip.sender.image && (
                <img src={tip.sender.image} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1 text-xs">
                <span className="font-medium">{tip.sender.name}</span>
                <span className="text-komapara-muted"> → </span>
                <span className="font-medium">{tip.receiver.name}</span>
                <span className="text-komapara-muted"> · </span>
                <Link href={`/work/${tip.work.id}`} className="text-komapara-muted hover:underline truncate">
                  {tip.work.title}
                </Link>
              </div>
              <span className="text-xs font-bold bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent shrink-0">
                {tip.amount.toLocaleString()}円
              </span>
              <span className="text-xs text-komapara-muted shrink-0">
                {formatRelativeTime(tip.createdAt)}
              </span>
            </div>
          ))}
          {recentTips.length === 0 && (
            <p className="text-sm text-komapara-muted text-center py-4">投げ銭はまだありません</p>
          )}
        </div>
      </div>

      {/* サブスクリプションセクション */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold gradient-text">サブスクリプション</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${subsEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {subsEnabled ? "有効" : "無効"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-purple-50 to-blue-50">
            <p className="text-lg font-bold bg-linear-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              {subAmount.toLocaleString()}円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">総額</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-emerald-50 to-green-50">
            <p className="text-lg font-bold bg-linear-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              {subFee.toLocaleString()}円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">手数料(15%)</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50">
            <p className="text-lg font-bold bg-linear-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
              {(subAmount - subFee).toLocaleString()}円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">クリエイター還元</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-indigo-50 to-purple-50">
            <p className="text-lg font-bold bg-linear-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
              {activeSubCount}
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">アクティブ購読</p>
          </div>
        </div>
        <div className="space-y-2">
          {recentSubs.map((sub) => (
            <div key={sub.id} className="flex items-center gap-3 py-1.5 border-b border-komapara-border/30 last:border-b-0">
              {sub.subscriber.image && (
                <img src={sub.subscriber.image} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1 text-xs">
                <span className="font-medium">{sub.subscriber.name}</span>
                <span className="text-komapara-muted"> → </span>
                <span className="font-medium">{sub.creator.name}</span>
                <span className="text-komapara-muted"> · {sub.plan.name}</span>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${sub.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {sub.status === "active" ? "有効" : sub.status === "cancelled" ? "解約済" : "期限切れ"}
              </span>
              <span className="text-xs font-bold bg-linear-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent shrink-0">
                {sub.plan.price.toLocaleString()}円/月
              </span>
              <span className="text-xs text-komapara-muted shrink-0">
                {formatRelativeTime(sub.createdAt)}
              </span>
            </div>
          ))}
          {recentSubs.length === 0 && (
            <p className="text-sm text-komapara-muted text-center py-4">サブスクリプションはまだありません</p>
          )}
        </div>
      </div>

      {/* プレミアム会員セクション */}
      <div className="glass rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold gradient-text">プレミアム会員</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${premiumEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {premiumEnabled ? "有効" : "無効"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-yellow-50 to-orange-50">
            <p className="text-lg font-bold bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              {premiumAmount.toLocaleString()}円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">総収入</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-purple-50 to-blue-50">
            <p className="text-lg font-bold bg-linear-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              {activePremiumCount}
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">アクティブ会員</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-linear-to-br from-pink-50 to-red-50">
            <p className="text-lg font-bold bg-linear-to-r from-pink-400 to-red-500 bg-clip-text text-transparent">
              300円
            </p>
            <p className="text-xs text-komapara-muted mt-0.5">月額</p>
          </div>
        </div>
        <div className="space-y-2">
          {recentPremium.map((ps) => (
            <div key={ps.id} className="flex items-center gap-3 py-1.5 border-b border-komapara-border/30 last:border-b-0">
              {ps.user.image && (
                <img src={ps.user.image} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1 text-xs">
                <span className="font-medium">{ps.user.name}</span>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${ps.status === "active" ? "bg-green-100 text-green-700" : ps.status === "cancelled" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                {ps.status === "active" ? "有効" : ps.status === "cancelled" ? "解約済" : "期限切れ"}
              </span>
              <span className="text-xs font-bold bg-linear-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent shrink-0">
                {ps.amount.toLocaleString()}円
              </span>
              <span className="text-xs text-komapara-muted shrink-0">
                {formatRelativeTime(ps.createdAt)}
              </span>
            </div>
          ))}
          {recentPremium.length === 0 && (
            <p className="text-sm text-komapara-muted text-center py-4">プレミアム会員はまだいません</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 最近の作品 */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold gradient-text">最近の作品</h2>
            <Link
              href="/admin/works"
              className="text-xs text-komapara-muted hover:text-komapara-text transition-colors"
            >
              すべて見る →
            </Link>
          </div>
          <div className="space-y-3">
            {recentWorks.map((work) => (
              <div key={work.id} className="flex items-center gap-3">
                {work.panels[0] && (
                  <img
                    src={work.panels[0]}
                    alt=""
                    className="w-10 h-10 rounded-sm object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{work.title}</p>
                  <p className="text-xs text-komapara-muted">
                    {work.author.name} · {formatRelativeTime(work.createdAt)}
                  </p>
                </div>
                <div className="text-xs text-komapara-muted shrink-0">
                  {work.viewCount} PV
                </div>
              </div>
            ))}
            {recentWorks.length === 0 && (
              <p className="text-sm text-komapara-muted text-center py-4">
                作品はまだありません
              </p>
            )}
          </div>
        </div>

        {/* 最近のコメント */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold gradient-text">最近のコメント</h2>
            <Link
              href="/admin/comments"
              className="text-xs text-komapara-muted hover:text-komapara-text transition-colors"
            >
              すべて見る →
            </Link>
          </div>
          <div className="space-y-3">
            {recentComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                {comment.user.image && (
                  <img
                    src={comment.user.image}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-komapara-muted">
                    <span className="font-medium text-komapara-text">
                      {comment.user.name}
                    </span>
                    {" → "}
                    <Link
                      href={`/work/${comment.work.id}`}
                      className="hover:underline"
                    >
                      {comment.work.title}
                    </Link>
                  </p>
                  <p className="text-sm mt-0.5 line-clamp-2">{comment.body}</p>
                  <p className="text-xs text-komapara-muted mt-0.5">
                    {formatRelativeTime(comment.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {recentComments.length === 0 && (
              <p className="text-sm text-komapara-muted text-center py-4">
                コメントはまだありません
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
