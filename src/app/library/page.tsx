import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WorkCard } from "@/components/works/WorkCard";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "マイライブラリ",
};

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const likedWorks = await prisma.like.findMany({
    where: { userId: session.user.id },
    include: {
      work: {
        include: {
          author: { select: { id: true, name: true, image: true } },
          tags: { select: { name: true, slug: true, emoji: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-main px-4 py-5 text-white rounded-b-2xl">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">📚</span> マイライブラリ
        </h1>
        <p className="text-white/80 text-sm mt-1">
          いいねした作品 ({likedWorks.length})
        </p>
      </div>

      <div className="px-4 py-4">
        {likedWorks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {likedWorks.map((like, index) => (
              <div
                key={like.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
              >
                <WorkCard
                  id={like.work.id}
                  title={like.work.title}
                  panels={like.work.panels}
                  author={like.work.author}
                  genres={like.work.tags}
                  likeCount={like.work.likeCount}
                  createdAt={like.work.createdAt.toISOString()}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-komapara-muted glass rounded-xl">
            <p className="text-lg mb-2">まだいいねした作品がありません</p>
            <p className="text-sm mb-4">
              気になる作品にいいねして、ライブラリに追加しましょう
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              作品を探す
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
