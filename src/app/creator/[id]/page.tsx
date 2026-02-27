import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WorkCard } from "@/components/works/WorkCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FollowButton } from "@/components/auth/FollowButton";

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

  const tipStats = await prisma.tip.aggregate({
    where: { receiverId: params.id, paymentStatus: "completed" },
    _sum: { amount: true },
    _count: true,
  }).catch(() => ({ _sum: { amount: 0 }, _count: 0 }));

  let isFollowing = false;
  if (session?.user?.id && session.user.id !== user.id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowing = !!follow;
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
        </div>
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
