import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PremiumCard } from "@/components/premium/PremiumCard";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "アカウント設定",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // プレミアム情報を取得
  const [user, premiumSub, premiumSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, premiumExpiry: true },
    }),
    prisma.premiumSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["active", "cancelled"] },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.siteSetting
      .findUnique({ where: { key: "premium_enabled" } })
      .catch(() => null),
  ]);

  const isPremium = !!(
    user?.isPremium &&
    user?.premiumExpiry &&
    new Date(user.premiumExpiry) > new Date()
  );
  const premiumEnabled = premiumSetting?.value !== "false";

  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold gradient-text">アカウント設定</h1>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          {session.user.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || ""}
              className="w-16 h-16 rounded-full ring-2 ring-purple-200/50"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-600 text-xl font-bold">
              {session.user.name?.[0] || "?"}
            </div>
          )}
          <div>
            <p className="font-medium text-komapara-text">
              {session.user.name}
            </p>
            <p className="text-sm text-komapara-muted">{session.user.email}</p>
          </div>
        </div>

        <p className="text-sm text-komapara-muted">
          プロフィール編集機能は近日公開予定です。
        </p>
      </div>

      {/* プレミアム */}
      <PremiumCard
        currentSubscription={
          premiumSub
            ? {
                id: premiumSub.id,
                status: premiumSub.status,
                amount: premiumSub.amount,
                currentPeriodEnd: premiumSub.currentPeriodEnd.toISOString(),
                createdAt: premiumSub.createdAt.toISOString(),
              }
            : null
        }
        isPremium={isPremium}
        premiumEnabled={premiumEnabled}
      />
    </div>
  );
}
