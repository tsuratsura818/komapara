import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStripe, isStripeEnabled } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// POST: Connectアカウント作成 → オンボーディングリンクを返す
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const stripe = getStripe();
    if (!stripe || !isStripeEnabled()) {
      return NextResponse.json(
        { error: "Stripe決済は現在利用できません" },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeConnectAccountId: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    let accountId = user.stripeConnectAccountId;

    // 既存のConnectアカウントがなければ新規作成
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "JP",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // オンボーディングリンク生成
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/settings?stripe=refresh`,
      return_url: `${baseUrl}/settings?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("POST /api/stripe/connect error:", error);
    return NextResponse.json(
      { error: "Connectアカウントの作成に失敗しました" },
      { status: 500 }
    );
  }
}

// GET: Connect状態を確認
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeConnectAccountId: true,
        stripeConnectOnboarded: true,
      },
    });

    if (!user?.stripeConnectAccountId) {
      return NextResponse.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      // Stripe未設定だがDBにIDが残っている場合
      return NextResponse.json({
        connected: true,
        chargesEnabled: user.stripeConnectOnboarded,
        payoutsEnabled: user.stripeConnectOnboarded,
      });
    }

    const account = await stripe.accounts.retrieve(user.stripeConnectAccountId);

    return NextResponse.json({
      connected: true,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
    });
  } catch (error) {
    console.error("GET /api/stripe/connect error:", error);
    return NextResponse.json(
      { error: "Connect状態の取得に失敗しました" },
      { status: 500 }
    );
  }
}
