import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkCard } from "@/components/works/WorkCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ダッシュボード",
};

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

  const totalViews = user.works.reduce((sum, w) => sum + w.viewCount, 0);
  const totalLikes = user.works.reduce((sum, w) => sum + w.likeCount, 0);

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-komapara-text mb-6">
        ダッシュボード
      </h1>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "作品数", value: user.works.length },
          { label: "総閲覧数", value: totalViews },
          { label: "総いいね", value: totalLikes },
          { label: "フォロワー", value: user._count.followers },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-komapara-border p-4 text-center"
          >
            <p className="text-2xl font-bold text-primary-500">{stat.value}</p>
            <p className="text-xs text-komapara-muted mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 自分の作品 */}
      <h2 className="text-sm font-semibold text-komapara-text mb-3">
        あなたの作品
      </h2>
      {user.works.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {user.works.map((work) => (
            <WorkCard
              key={work.id}
              id={work.id}
              title={work.title}
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
        <div className="text-center py-10 text-komapara-muted">
          <p>まだ作品がありません</p>
          <a
            href="/upload"
            className="inline-block mt-2 text-primary-500 hover:underline"
          >
            最初の4コマを投稿する
          </a>
        </div>
      )}
    </div>
  );
}
