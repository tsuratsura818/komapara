import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadWizard } from "@/components/works/upload/UploadWizard";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageTitle } from "@/components/layout/PageTitle";

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

  return (
    <>
      <PageTitle sub="Instagram / X から取り込むか、画像を直接アップロード">投稿する</PageTitle>
      <UploadWizard userSeries={userSeries} />
    </>
  );
}
