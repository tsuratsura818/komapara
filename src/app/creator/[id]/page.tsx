import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WorkCard } from "@/components/works/WorkCard";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FollowButton } from "@/components/auth/FollowButton";

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
    <div className="px-4 py-6">
      {/* プロフィール */}
      <div className="flex items-start gap-4 mb-6">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || ""}
            className="w-16 h-16 rounded-full"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">
            {user.name?.[0] || "?"}
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-lg font-bold text-komapara-text">{user.name}</h1>
          {user.xHandle && (
            <p className="text-sm text-komapara-muted">@{user.xHandle}</p>
          )}
          {user.bio && (
            <p className="text-sm text-komapara-text mt-1">{user.bio}</p>
          )}

          <div className="flex gap-4 mt-2 text-sm text-komapara-muted">
            <span>
              <strong className="text-komapara-text">
                {user._count.works}
              </strong>{" "}
              作品
            </span>
            <span>
              <strong className="text-komapara-text">
                {user._count.followers}
              </strong>{" "}
              フォロワー
            </span>
          </div>

          {session?.user?.id !== user.id && session && (
            <div className="mt-3">
              <FollowButton userId={user.id} initialFollowing={isFollowing} />
            </div>
          )}
        </div>
      </div>

      {/* 作品一覧 */}
      <div className="border-t border-komapara-border pt-4">
        <h2 className="text-sm font-semibold text-komapara-text mb-3">
          作品 ({user._count.works})
        </h2>

        {user.works.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {user.works.map((work) => (
              <WorkCard
                key={work.id}
                id={work.id}
                title={work.title}
                panels={work.panels}
                author={{ id: user.id, name: user.name, image: user.image }}
                genres={work.tags}
                likeCount={work.likeCount}
                createdAt={work.createdAt.toISOString()}
              />
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
