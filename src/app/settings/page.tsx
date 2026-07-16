import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { StripeConnectCard } from "@/components/settings/StripeConnectCard";
import { ProfileForm } from "@/components/settings/ProfileForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "アカウント設定",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, premiumSub, premiumSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isPremium: true,
        premiumExpiry: true,
        isCreator: true,
        stripeConnectOnboarded: true,
        name: true,
        bio: true,
        image: true,
        xHandle: true,
        instagramHandle: true,
        websiteUrl: true,
      },
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

      <ProfileForm
        initial={{
          name: user?.name ?? session.user.name ?? "",
          bio: user?.bio ?? null,
          image: user?.image ?? session.user.image ?? null,
          xHandle: user?.xHandle ?? null,
          instagramHandle: user?.instagramHandle ?? null,
          websiteUrl: user?.websiteUrl ?? null,
        }}
      />

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

      {/* Stripe Connect（クリエイターのみ） */}
      {user?.isCreator && (
        <StripeConnectCard
          isConnected={user.stripeConnectOnboarded ?? false}
          chargesEnabled={user.stripeConnectOnboarded ?? false}
        />
      )}
    </div>
  );
}
