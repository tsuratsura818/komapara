import { prisma } from "@/lib/prisma";
import { AdvertiseClient } from "./AdvertiseClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "広告管理" };

export default async function AdminAdvertisePage() {
  const ads = await prisma.advertisement.findMany({
    orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
  });

  return <AdvertiseClient initialAds={ads} />;
}
