import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getSiteSetting } from "@/lib/admin";

// PATCH: プラン更新
export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const enabled = await getSiteSetting("subscriptions_enabled");
    if (enabled === "false") {
      return NextResponse.json({ error: "サブスク機能は現在無効です" }, { status: 403 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: params.id } });
    if (!plan) {
      return NextResponse.json({ error: "プランが見つかりません" }, { status: 404 });
    }
    if (plan.creatorId !== session.user.id) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { name, price, description } = await request.json();

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.length === 0 || name.length > 50) {
        return NextResponse.json({ error: "プラン名は1〜50文字で入力してください" }, { status: 400 });
      }
      data.name = name.trim();
    }
    if (price !== undefined) {
      if (typeof price !== "number" || !Number.isInteger(price) || price < 100 || price > 10000) {
        return NextResponse.json({ error: "価格は100円〜10,000円で指定してください" }, { status: 400 });
      }
      data.price = price;
    }
    if (description !== undefined) {
      if (description && (typeof description !== "string" || description.length > 500)) {
        return NextResponse.json({ error: "説明は500文字以内で入力してください" }, { status: 400 });
      }
      data.description = description?.trim() || null;
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/subscriptions/plans/[id] error:", error);
    return NextResponse.json({ error: "プランの更新に失敗しました" }, { status: 500 });
  }
}

// DELETE: プラン無効化（soft delete）
export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: params.id } });
    if (!plan) {
      return NextResponse.json({ error: "プランが見つかりません" }, { status: 404 });
    }
    if (plan.creatorId !== session.user.id) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "プランを無効化しました" });
  } catch (error) {
    console.error("DELETE /api/subscriptions/plans/[id] error:", error);
    return NextResponse.json({ error: "プランの無効化に失敗しました" }, { status: 500 });
  }
}
