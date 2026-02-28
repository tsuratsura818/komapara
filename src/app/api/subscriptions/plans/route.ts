import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSiteSetting } from "@/lib/admin";

const MAX_PLANS = 3;
const MIN_PRICE = 100;
const MAX_PRICE = 10000;

// GET: クリエイターのプラン一覧（公開）
export async function GET(request: NextRequest) {
  try {
    const creatorId = request.nextUrl.searchParams.get("creatorId");
    if (!creatorId) {
      return NextResponse.json({ error: "creatorIdが必要です" }, { status: 400 });
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: { creatorId, isActive: true },
      orderBy: { price: "asc" },
      include: { _count: { select: { subscriptions: { where: { status: "active" } } } } },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/subscriptions/plans error:", error);
    return NextResponse.json({ error: "プランの取得に失敗しました" }, { status: 500 });
  }
}

// POST: プラン作成（クリエイターのみ）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const enabled = await getSiteSetting("subscriptions_enabled");
    if (enabled === "false") {
      return NextResponse.json({ error: "サブスク機能は現在無効です" }, { status: 403 });
    }

    const { success } = rateLimit(`sub-plan:create:${session.user.id}`, {
      limit: 20,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json({ error: "操作の上限に達しました" }, { status: 429 });
    }

    const { name, price, description } = await request.json();

    if (!name || typeof name !== "string" || name.length > 50) {
      return NextResponse.json({ error: "プラン名は1〜50文字で入力してください" }, { status: 400 });
    }
    if (typeof price !== "number" || !Number.isInteger(price) || price < MIN_PRICE || price > MAX_PRICE) {
      return NextResponse.json({ error: `価格は${MIN_PRICE}円〜${MAX_PRICE}円で指定してください` }, { status: 400 });
    }
    if (description && (typeof description !== "string" || description.length > 500)) {
      return NextResponse.json({ error: "説明は500文字以内で入力してください" }, { status: 400 });
    }

    // アクティブなプラン数チェック
    const activePlans = await prisma.subscriptionPlan.count({
      where: { creatorId: session.user.id, isActive: true },
    });
    if (activePlans >= MAX_PLANS) {
      return NextResponse.json({ error: `プランは最大${MAX_PLANS}個までです` }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        creatorId: session.user.id,
        name: name.trim(),
        price,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/subscriptions/plans error:", error);
    return NextResponse.json({ error: "プランの作成に失敗しました" }, { status: 500 });
  }
}
