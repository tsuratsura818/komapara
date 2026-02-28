import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "サイト設定" };

const DEFAULT_SETTINGS: Record<string, string> = {
  registration_enabled: "true",
  comments_enabled: "true",
  x_auto_post_enabled: "true",
  tips_enabled: "true",
  subscriptions_enabled: "true",
  premium_enabled: "false",
  push_notifications_enabled: "true",
};

export default async function AdminSettingsPage() {
  const [dbSettings, tags] = await Promise.all([
    prisma.siteSetting.findMany().catch(() => []),
    prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { works: true } } },
    }).catch(() => []),
  ]);

  const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const s of dbSettings) {
    settings[s.key] = s.value;
  }

  return <SettingsClient initialSettings={settings} initialTags={tags} />;
}
