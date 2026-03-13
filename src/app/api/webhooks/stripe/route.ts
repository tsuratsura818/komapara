import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

const PLATFORM_TIP_FEE_RATE = 0.1;
const PLATFORM_SUB_FEE_RATE = 0.15;

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe未設定" }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET が設定されていません");
    return NextResponse.json({ error: "Webhook設定エラー" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "署名がありません" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "署名検証に失敗";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: `署名検証エラー: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        // 未処理のイベントはログのみ
        console.log(`未処理のWebhookイベント: ${event.type}`);
    }
  } catch (error) {
    console.error(`Webhookイベント処理エラー (${event.type}):`, error);
    // エラーでも200を返す（Stripe再試行防止）
  }

  return NextResponse.json({ received: true });
}

// checkout.session.completed ハンドラ
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  if (!metadata?.type) {
    console.warn("checkout.session.completed: メタデータにtypeがありません");
    return;
  }

  switch (metadata.type) {
    case "tip":
      await handleTipCompleted(metadata, session);
      break;
    case "subscription":
      await handleSubscriptionCompleted(metadata, session);
      break;
    case "premium":
      await handlePremiumCompleted(metadata, session);
      break;
    default:
      console.warn(`未知のチェックアウトタイプ: ${metadata.type}`);
  }
}

// 投げ銭完了
async function handleTipCompleted(
  metadata: Stripe.Metadata,
  session: Stripe.Checkout.Session
) {
  const { workId, senderId, receiverId, message } = metadata;
  if (!workId || !senderId || !receiverId) {
    console.error("投げ銭メタデータ不足:", metadata);
    return;
  }

  const amount = session.amount_total ?? 0;
  const platformFee = Math.floor(amount * PLATFORM_TIP_FEE_RATE);
  const netAmount = amount - platformFee;

  await prisma.$transaction([
    prisma.tip.create({
      data: {
        amount,
        platformFee,
        netAmount,
        message: message || null,
        senderId,
        receiverId,
        workId,
        paymentStatus: "completed",
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      },
    }),
    prisma.work.update({
      where: { id: workId },
      data: { tipTotal: { increment: amount } },
    }),
  ]);
}

// サブスクリプション完了
async function handleSubscriptionCompleted(
  metadata: Stripe.Metadata,
  session: Stripe.Checkout.Session
) {
  const { subscriberId, creatorId, planId } = metadata;
  if (!subscriberId || !creatorId || !planId) {
    console.error("サブスクメタデータ不足:", metadata);
    return;
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: { price: true },
  });

  if (!plan) {
    console.error("プランが見つかりません:", planId);
    return;
  }

  const platformFee = Math.floor(plan.price * PLATFORM_SUB_FEE_RATE);
  const netAmount = plan.price - platformFee;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  // 30日後を期間終了日とする（Webhook内で正確な値はsubscription.updatedで同期）
  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: {
      subscriberId_creatorId: { subscriberId, creatorId },
    },
    update: {
      planId,
      status: "active",
      currentPeriodEnd,
      amount: plan.price,
      platformFee,
      netAmount,
      paymentStatus: "completed",
      stripeSubscriptionId,
    },
    create: {
      subscriberId,
      creatorId,
      planId,
      status: "active",
      currentPeriodEnd,
      amount: plan.price,
      platformFee,
      netAmount,
      paymentStatus: "completed",
      stripeSubscriptionId,
    },
  });
}

// プレミアム完了
async function handlePremiumCompleted(
  metadata: Stripe.Metadata,
  session: Stripe.Checkout.Session
) {
  const { userId } = metadata;
  if (!userId) {
    console.error("プレミアムメタデータ不足:", metadata);
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.premiumSubscription.create({
      data: {
        userId,
        status: "active",
        amount: 300,
        currentPeriodEnd,
        paymentStatus: "completed",
        stripeSubscriptionId,
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
}

// サブスクリプション削除（解約完了）
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubId = subscription.id;

  // クリエイターサブスクリプション
  const creatorSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (creatorSub) {
    await prisma.subscription.update({
      where: { id: creatorSub.id },
      data: { status: "cancelled" },
    });
    return;
  }

  // プレミアムサブスクリプション
  const premiumSub = await prisma.premiumSubscription.findFirst({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (premiumSub) {
    await prisma.$transaction(async (tx) => {
      await tx.premiumSubscription.update({
        where: { id: premiumSub.id },
        data: { status: "cancelled" },
      });

      await tx.user.update({
        where: { id: premiumSub.userId },
        data: { isPremium: false },
      });
    });
  }
}

// サブスクリプション更新（期間延長等）
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripeSubId = subscription.id;
  // v20ではcurrent_period_endはSubscriptionItemに移動
  const firstItem = subscription.items?.data?.[0];
  const periodEndTimestamp = firstItem?.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const currentPeriodEnd = new Date(periodEndTimestamp * 1000);

  // クリエイターサブスクリプション
  const creatorSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (creatorSub) {
    await prisma.subscription.update({
      where: { id: creatorSub.id },
      data: {
        currentPeriodEnd,
        status: subscription.status === "active" ? "active" : "cancelled",
      },
    });
    return;
  }

  // プレミアムサブスクリプション
  const premiumSub = await prisma.premiumSubscription.findFirst({
    where: { stripeSubscriptionId: stripeSubId },
  });
  if (premiumSub) {
    const isActive = subscription.status === "active";
    await prisma.$transaction(async (tx) => {
      await tx.premiumSubscription.update({
        where: { id: premiumSub.id },
        data: {
          currentPeriodEnd,
          status: isActive ? "active" : "cancelled",
        },
      });

      await tx.user.update({
        where: { id: premiumSub.userId },
        data: {
          isPremium: isActive,
          premiumExpiry: currentPeriodEnd,
        },
      });
    });
  }
}

// Connectアカウント更新
async function handleAccountUpdated(account: Stripe.Account) {
  const connectAccountId = account.id;

  const user = await prisma.user.findFirst({
    where: { stripeConnectAccountId: connectAccountId },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeConnectOnboarded: account.charges_enabled ?? false,
      },
    });
  }
}
