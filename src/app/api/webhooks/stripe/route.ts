import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  PLATFORM_SUB_FEE_RATE,
  PREMIUM_PRICE,
} from "@/lib/fees";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

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

  // 冪等性ガード。Stripeはネットワーク不達時に同じイベントを再送するため、
  // event.id を先に記録して重複を弾く。記録の作成が一意制約で落ちれば
  // 「既に処理済み」＝二重のサブスク・プレミアム計上を防ぐ。
  try {
    await prisma.processedWebhookEvent.create({
      data: { id: event.id, type: event.type },
    });
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      console.log(`Webhook重複スキップ: ${event.id} (${event.type})`);
      return NextResponse.json({ received: true, duplicate: true });
    }
    // 記録自体に失敗（DB障害等）した場合は、二重計上を避けるため処理を進めず
    // 500を返してStripeに再送させる
    console.error("Webhookイベント記録に失敗:", e);
    return NextResponse.json({ error: "一時的なエラー" }, { status: 500 });
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
    // 処理に失敗したのに記録が残ると、Stripeの再送を冪等ガードが弾いて
    // 永久に未処理のままになる。記録を取り消して再送で復旧できるようにし、
    // 500でStripeに再送を促す
    await prisma.processedWebhookEvent
      .delete({ where: { id: event.id } })
      .catch((e) => console.error("Webhook記録の取り消しに失敗:", e));
    return NextResponse.json({ error: "処理中にエラーが発生しました" }, { status: 500 });
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
        amount: PREMIUM_PRICE,
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
