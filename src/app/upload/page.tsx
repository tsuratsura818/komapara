import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkUploadForm } from "@/components/works/WorkUploadForm";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "投稿する",
};

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userSeries = await prisma.series.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true },
  }).catch(() => []);

  return <WorkUploadForm userSeries={userSeries} />;
}
