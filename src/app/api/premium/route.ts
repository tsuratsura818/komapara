import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteSetting } from "@/lib/admin";

const PREMIUM_PRICE = 300; // 300円/月

// GET: プレミアムステータス取得
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const premiumEnabled = await getSiteSetting("premium_enabled");

    const subscription = await prisma.premiumSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["active", "cancelled"] },
      },
      orderBy: { createdAt: "desc" },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, premiumExpiry: true },
    });

    const isActive =
      user?.isPremium &&
      user?.premiumExpiry &&
      new Date(user.premiumExpiry) > new Date();

    return NextResponse.json({
      premiumEnabled: premiumEnabled !== "false",
      isPremium: isActive ?? false,
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            amount: subscription.amount,
            currentPeriodEnd: subscription.currentPeriodEnd,
            createdAt: subscription.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/premium error:", error);
    return NextResponse.json(
      { error: "取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST: プレミアム購読開始
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { success } = await rateLimit(`premium:create:${session.user.id}`, {
      limit: 10,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "操作の上限に達しました" },
        { status: 429 }
      );
    }

    const enabled = await getSiteSetting("premium_enabled");
    if (enabled === "false") {
      return NextResponse.json(
        { error: "プレミアム機能は現在無効です" },
        { status: 403 }
      );
    }

    // 既にアクティブかチェック
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true, premiumExpiry: true },
    });
    if (
      user?.isPremium &&
      user?.premiumExpiry &&
      new Date(user.premiumExpiry) > new Date()
    ) {
      return NextResponse.json(
        { error: "既にプレミアム会員です" },
        { status: 400 }
      );
    }

    const currentPeriodEnd = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    // トランザクションで購読作成 + ユーザー更新
    const subscription = await prisma.$transaction(async (tx) => {
      const sub = await tx.premiumSubscription.create({
        data: {
          userId: session.user.id,
          status: "active",
          amount: PREMIUM_PRICE,
          currentPeriodEnd,
          paymentStatus: "completed",
        },
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          isPremium: true,
          premiumExpiry: currentPeriodEnd,
        },
      });

      return sub;
    });

    return NextResponse.json(
      {
        message: "プレミアム会員になりました！広告が非表示になります",
        subscription: {
          id: subscription.id,
          status: subscription.status,
          amount: subscription.amount,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/premium error:", error);
    return NextResponse.json(
      { error: "購読の開始に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE: プレミアム解約
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const subscription = await prisma.premiumSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "アクティブなプレミアム購読が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.premiumSubscription.update({
      where: { id: subscription.id },
      data: { status: "cancelled" },
    });

    // isPremiumは期間終了まで維持（セッションの期限チェックで制御）
    return NextResponse.json({
      message: `購読を解約しました。${new Date(subscription.currentPeriodEnd).toLocaleDateString("ja-JP")}までご利用いただけます`,
    });
  } catch (error) {
    console.error("DELETE /api/premium error:", error);
    return NextResponse.json(
      { error: "解約に失敗しました" },
      { status: 500 }
    );
  }
}
