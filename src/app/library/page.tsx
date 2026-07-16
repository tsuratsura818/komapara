import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LibraryTabs } from "@/components/library/LibraryTabs";
import type { Metadata } from "next";
import { PageTitle } from "@/components/layout/PageTitle";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "マイライブラリ",
};

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [likedWorks, readHistory] = await Promise.all([
    prisma.like.findMany({
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
    }),
    prisma.readHistory.findMany({
      where: { userId: session.user.id },
      include: {
        work: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            tags: { select: { name: true, slug: true, emoji: true } },
          },
        },
      },
      orderBy: { readAt: "desc" },
      take: 100,
    }),
  ]);

  const likedWorksData = likedWorks.map((like) => ({
    id: like.work.id,
    title: like.work.title,
    panels: like.work.panels,
    author: like.work.author,
    genres: like.work.tags,
    likeCount: like.work.likeCount,
    createdAt: like.work.createdAt.toISOString(),
    reaction: like.reaction,
  }));

  const readWorksData = readHistory.map((h) => ({
    id: h.work.id,
    title: h.work.title,
    panels: h.work.panels,
    author: h.work.author,
    genres: h.work.tags,
    likeCount: h.work.likeCount,
    createdAt: h.work.createdAt.toISOString(),
    readAt: h.readAt.toISOString(),
  }));

  return (
    <>
      <PageTitle sub="いいねした作品と、読んだ作品">マイライブラリ</PageTitle>
      <LibraryTabs
        likedWorks={likedWorksData}
        readWorks={readWorksData}
      />
    </>
  );
}
