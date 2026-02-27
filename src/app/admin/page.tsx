import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "ダッシュボード" };

const STAT_STYLES = [
  { gradient: "from-purple-500 to-blue-500" },
  { gradient: "from-blue-500 to-cyan-500" },
  { gradient: "from-green-500 to-emerald-500" },
  { gradient: "from-pink-500 to-red-500" },
  { gradient: "from-orange-500 to-yellow-500" },
];

export default async function AdminDashboardPage() {
  const [userCount, workCount, commentCount, likeCount, viewStats, recentWorks, recentComments] =
    await Promise.all([
      prisma.user.count(),
      prisma.work.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.work.aggregate({ _sum: { viewCount: true } }),
      prisma.work.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { author: { select: { id: true, name: true, image: true } } },
      }),
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          user: { select: { id: true, name: true, image: true } },
          work: { select: { id: true, title: true } },
        },
      }),
    ]);

  const totalPV = viewStats._sum.viewCount || 0;

  const stats = [
    { label: "ユーザー数", value: userCount },
    { label: "作品数", value: workCount },
    { label: "総PV", value: totalPV },
    { label: "総いいね", value: likeCount },
    { label: "コメント数", value: commentCount },
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
                    className="w-10 h-10 rounded object-cover shrink-0"
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
