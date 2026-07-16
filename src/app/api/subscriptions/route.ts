import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteSetting } from "@/lib/admin";
import { isStripeEnabled } from "@/lib/stripe";
import { PLATFORM_SUB_FEE_RATE } from "@/lib/fees";

// GET: 指定クリエイターへの現在ユーザーの購読状態（creatorページのISR化で個別状態を分離）
export async function GET(request: NextRequest) {
  const session = await auth();
  const creatorId = new URL(request.url).searchParams.get("creatorId");
  if (!session?.user?.id || !creatorId) {
    return NextResponse.json({ subscription: null });
  }
  const sub = await prisma.subscription
    .findUnique({
      where: {
        subscriberId_creatorId: { subscriberId: session.user.id, creatorId },
      },
      include: { plan: { select: { name: true, price: true } } },
    })
    .catch(() => null);
  return NextResponse.json({
    subscription:
      sub && sub.status === "active"
        ? { id: sub.id, status: sub.status, plan: sub.plan }
        : null,
  });
}

// POST: サブスクリプション開始
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // 本番(Stripe有効時)は無決済のモックサブスクを禁止。決済は /api/stripe/checkout 経由
    if (isStripeEnabled()) {
      return NextResponse.json(
        { error: "決済は /api/stripe/checkout 経由で行ってください" },
        { status: 400 }
      );
    }

    const { success } = await rateLimit(`sub:create:${session.user.id}`, {
      limit: 20,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json({ error: "操作の上限に達しました" }, { status: 429 });
    }

    const enabled = await getSiteSetting("subscriptions_enabled");
    if (enabled === "false") {
      return NextResponse.json({ error: "サブスク機能は現在無効です" }, { status: 403 });
    }

    const { planId } = await request.json();

    if (!planId || typeof planId !== "string") {
      return NextResponse.json({ error: "プランIDが必要です" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, creatorId: true, price: true, isActive: true },
    });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "有効なプランが見つかりません" }, { status: 404 });
    }
    if (session.user.id === plan.creatorId) {
      return NextResponse.json({ error: "自分のプランには購読できません" }, { status: 400 });
    }

    // 既存のアクティブな購読チェック
    const existing = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId: session.user.id,
          creatorId: plan.creatorId,
        },
      },
    });
    if (existing && existing.status === "active") {
      return NextResponse.json({ error: "既にこのクリエイターを購読中です" }, { status: 400 });
    }

    const platformFee = Math.floor(plan.price * PLATFORM_SUB_FEE_RATE);
    const netAmount = plan.price - platformFee;
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subscription = existing
      ? await prisma.subscription.update({
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
          include: {
            plan: { select: { name: true, price: true } },
            creator: { select: { name: true } },
          },
        })
      : await prisma.subscription.create({
          data: {
            subscriberId: session.user.id,
            creatorId: plan.creatorId,
            planId: plan.id,
            status: "active",
            currentPeriodEnd,
            amount: plan.price,
            platformFee,
            netAmount,
            paymentStatus: "completed",
          },
          include: {
            plan: { select: { name: true, price: true } },
            creator: { select: { name: true } },
          },
        });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("POST /api/subscriptions error:", error);
    return NextResponse.json({ error: "購読の開始に失敗しました" }, { status: 500 });
  }
}

// DELETE: サブスクリプション解約
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { creatorId } = await request.json();

    if (!creatorId || typeof creatorId !== "string") {
      return NextResponse.json({ error: "クリエイターIDが必要です" }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId: session.user.id,
          creatorId,
        },
      },
    });

    if (!subscription || subscription.status !== "active") {
      return NextResponse.json({ error: "アクティブな購読が見つかりません" }, { status: 404 });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ message: "購読を解約しました。期間終了まではご利用いただけます" });
  } catch (error) {
    console.error("DELETE /api/subscriptions error:", error);
    return NextResponse.json({ error: "解約に失敗しました" }, { status: 500 });
  }
}
