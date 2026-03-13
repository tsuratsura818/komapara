import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStripe, isStripeEnabled } from "@/lib/stripe";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const PLATFORM_TIP_FEE_RATE = 0.1; // 投げ銭手数料10%
const PLATFORM_SUB_FEE_RATE = 0.15; // サブスク手数料15%
const PREMIUM_PRICE = 300; // プレミアム月額（円）

interface TipParams {
  type: "tip";
  workId: string;
  amount: number;
  message?: string;
}

interface SubscriptionParams {
  type: "subscription";
  planId: string;
}

interface PremiumParams {
  type: "premium";
}

type CheckoutParams = TipParams | SubscriptionParams | PremiumParams;

// POST: Checkout Session作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = (await request.json()) as CheckoutParams;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Stripe未設定時はモック決済にフォールバック
    if (!isStripeEnabled()) {
      return handleMockCheckout(body, session.user.id, baseUrl);
    }

    const stripe = getStripe();
    if (!stripe) {
      return handleMockCheckout(body, session.user.id, baseUrl);
    }

    // 顧客IDを取得/作成
    const customerId = await getOrCreateCustomerId(stripe, session.user.id);

    switch (body.type) {
      case "tip":
        return handleTipCheckout(stripe, body, session.user.id, customerId, baseUrl);
      case "subscription":
        return handleSubscriptionCheckout(stripe, body, session.user.id, customerId, baseUrl);
      case "premium":
        return handlePremiumCheckout(stripe, session.user.id, customerId, baseUrl);
      default:
        return NextResponse.json({ error: "不正なチェックアウトタイプです" }, { status: 400 });
    }
  } catch (error) {
    console.error("POST /api/stripe/checkout error:", error);
    return NextResponse.json(
      { error: "チェックアウトの作成に失敗しました" },
      { status: 500 }
    );
  }
}

// Stripe顧客IDを取得/作成
async function getOrCreateCustomerId(stripe: Stripe, userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true, name: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user?.email ?? undefined,
    name: user?.name ?? undefined,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

// 投げ銭 Checkout
async function handleTipCheckout(
  stripe: Stripe,
  params: TipParams,
  senderId: string,
  customerId: string,
  baseUrl: string
): Promise<NextResponse> {
  const { workId, amount, message } = params;

  if (!workId || typeof amount !== "number" || amount < 100 || amount > 10000) {
    return NextResponse.json(
      { error: "作品IDと金額（100〜10000円）が必要です" },
      { status: 400 }
    );
  }

  const work = await prisma.work.findUnique({
    where: { id: workId },
    select: {
      id: true,
      authorId: true,
      title: true,
      author: { select: { stripeConnectAccountId: true } },
    },
  });

  if (!work) {
    return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
  }

  if (senderId === work.authorId) {
    return NextResponse.json({ error: "自分の作品には投げ銭できません" }, { status: 400 });
  }

  const applicationFeeAmount = Math.floor(amount * PLATFORM_TIP_FEE_RATE);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    customer: customerId,
    currency: "jpy",
    line_items: [
      {
        price_data: {
          currency: "jpy",
          product_data: {
            name: `「${work.title}」への投げ銭`,
            description: message ? `メッセージ: ${message}` : undefined,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: "tip",
      workId,
      senderId,
      receiverId: work.authorId,
      message: message ?? "",
    },
    success_url: `${baseUrl}/work/${workId}?tip=success`,
    cancel_url: `${baseUrl}/work/${workId}`,
  };

  // クリエイターがConnect設定済みなら分配
  if (work.author.stripeConnectAccountId) {
    sessionParams.payment_intent_data = {
      application_fee_amount: applicationFeeAmount,
      transfer_data: {
        destination: work.author.stripeConnectAccountId,
      },
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

  return NextResponse.json({ url: checkoutSession.url });
}

// サブスクリプション Checkout
async function handleSubscriptionCheckout(
  stripe: Stripe,
  params: SubscriptionParams,
  subscriberId: string,
  customerId: string,
  baseUrl: string
): Promise<NextResponse> {
  const { planId } = params;

  if (!planId) {
    return NextResponse.json({ error: "プランIDが必要です" }, { status: 400 });
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      creatorId: true,
      price: true,
      name: true,
      isActive: true,
      stripePriceId: true,
      stripeProductId: true,
      creator: { select: { stripeConnectAccountId: true, name: true } },
    },
  });

  if (!plan || !plan.isActive) {
    return NextResponse.json({ error: "有効なプランが見つかりません" }, { status: 404 });
  }

  if (subscriberId === plan.creatorId) {
    return NextResponse.json({ error: "自分のプランには購読できません" }, { status: 400 });
  }

  // Stripe Price/Productが未作成なら作成
  let stripePriceId = plan.stripePriceId;
  if (!stripePriceId) {
    let stripeProductId = plan.stripeProductId;

    if (!stripeProductId) {
      const product = await stripe.products.create({
        name: `${plan.creator.name ?? "クリエイター"}のプラン: ${plan.name}`,
        metadata: { planId: plan.id, creatorId: plan.creatorId },
      });
      stripeProductId = product.id;
    }

    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: plan.price,
      currency: "jpy",
      recurring: { interval: "month" },
    });
    stripePriceId = price.id;

    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: { stripePriceId, stripeProductId },
    });
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    metadata: {
      type: "subscription",
      subscriberId,
      creatorId: plan.creatorId,
      planId: plan.id,
    },
    success_url: `${baseUrl}/creator/${plan.creatorId}?sub=success`,
    cancel_url: `${baseUrl}/creator/${plan.creatorId}`,
  };

  // クリエイターがConnect設定済みなら手数料分配
  if (plan.creator.stripeConnectAccountId) {
    sessionParams.subscription_data = {
      application_fee_percent: PLATFORM_SUB_FEE_RATE * 100, // 15%
      transfer_data: {
        destination: plan.creator.stripeConnectAccountId,
      },
    };
  }

  const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

  return NextResponse.json({ url: checkoutSession.url });
}

// プレミアム Checkout
async function handlePremiumCheckout(
  stripe: Stripe,
  userId: string,
  customerId: string,
  baseUrl: string
): Promise<NextResponse> {
  // 既にアクティブかチェック
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumExpiry: true },
  });

  if (user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date()) {
    return NextResponse.json({ error: "既にプレミアム会員です" }, { status: 400 });
  }

  // SiteSettingからPrice IDを取得、なければ作成
  let premiumPriceId: string | null = null;
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "stripe_premium_price_id" },
  });
  premiumPriceId = setting?.value ?? null;

  if (!premiumPriceId) {
    const product = await stripe.products.create({
      name: "コマパラ プレミアム会員",
      description: "広告非表示・プレミアム機能",
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PREMIUM_PRICE,
      currency: "jpy",
      recurring: { interval: "month" },
    });
    premiumPriceId = price.id;

    await prisma.siteSetting.upsert({
      where: { key: "stripe_premium_price_id" },
      update: { value: premiumPriceId },
      create: { key: "stripe_premium_price_id", value: premiumPriceId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: premiumPriceId, quantity: 1 }],
    metadata: {
      type: "premium",
      userId,
    },
    success_url: `${baseUrl}/settings?premium=success`,
    cancel_url: `${baseUrl}/settings`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}

// Stripe未設定時のモック決済（既存のDB直接書き込み）
async function handleMockCheckout(
  params: CheckoutParams,
  userId: string,
  baseUrl: string
): Promise<NextResponse> {
  switch (params.type) {
    case "tip": {
      const { workId, amount, message } = params;

      if (!workId || typeof amount !== "number" || amount < 100 || amount > 10000) {
        return NextResponse.json(
          { error: "作品IDと金額（100〜10000円）が必要です" },
          { status: 400 }
        );
      }

      const work = await prisma.work.findUnique({
        where: { id: workId },
        select: { id: true, authorId: true },
      });

      if (!work) {
        return NextResponse.json({ error: "作品が見つかりません" }, { status: 404 });
      }

      if (userId === work.authorId) {
        return NextResponse.json({ error: "自分の作品には投げ銭できません" }, { status: 400 });
      }

      const platformFee = Math.floor(amount * PLATFORM_TIP_FEE_RATE);
      const netAmount = amount - platformFee;

      await prisma.$transaction([
        prisma.tip.create({
          data: {
            amount,
            platformFee,
            netAmount,
            message: message?.trim() || null,
            senderId: userId,
            receiverId: work.authorId,
            workId: work.id,
            paymentStatus: "completed",
          },
        }),
        prisma.work.update({
          where: { id: workId },
          data: { tipTotal: { increment: amount } },
        }),
      ]);

      return NextResponse.json({
        url: `${baseUrl}/work/${workId}?tip=success`,
        mock: true,
      });
    }

    case "subscription": {
      const { planId } = params;

      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        select: { id: true, creatorId: true, price: true, isActive: true },
      });

      if (!plan || !plan.isActive) {
        return NextResponse.json({ error: "有効なプランが見つかりません" }, { status: 404 });
      }

      const platformFee = Math.floor(plan.price * PLATFORM_SUB_FEE_RATE);
      const netAmount = plan.price - platformFee;
      const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const existing = await prisma.subscription.findUnique({
        where: {
          subscriberId_creatorId: {
            subscriberId: userId,
            creatorId: plan.creatorId,
          },
        },
      });

      if (existing && existing.status === "active") {
        return NextResponse.json({ error: "既にこのクリエイターを購読中です" }, { status: 400 });
      }

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            planId: plan.id,
            status: "active",
            currentPeriodEnd,
            amount: plan.price,
            platformFee,
            netAmount,
            paymentStatus: "completed",
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            subscriberId: userId,
            creatorId: plan.creatorId,
            planId: plan.id,
            status: "active",
            currentPeriodEnd,
            amount: plan.price,
            platformFee,
            netAmount,
            paymentStatus: "completed",
          },
        });
      }

      return NextResponse.json({
        url: `${baseUrl}/creator/${plan.creatorId}?sub=success`,
        mock: true,
      });
    }

    case "premium": {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true, premiumExpiry: true },
      });

      if (user?.isPremium && user?.premiumExpiry && new Date(user.premiumExpiry) > new Date()) {
        return NextResponse.json({ error: "既にプレミアム会員です" }, { status: 400 });
      }

      const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await prisma.$transaction(async (tx) => {
        await tx.premiumSubscription.create({
          data: {
            userId,
            status: "active",
            amount: PREMIUM_PRICE,
            currentPeriodEnd,
            paymentStatus: "completed",
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumExpiry: currentPeriodEnd,
          },
        });
      });

      return NextResponse.json({
        url: `${baseUrl}/settings?premium=success`,
        mock: true,
      });
    }

    default:
      return NextResponse.json({ error: "不正なチェックアウトタイプです" }, { status: 400 });
  }
}
