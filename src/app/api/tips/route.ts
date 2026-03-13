import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 10000;
const PLATFORM_FEE_RATE = 0.1;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { success } = await rateLimit(`tips:post:${session.user.id}`, {
      limit: 50,
      windowMs: 24 * 60 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json(
        { error: "投げ銭の上限に達しました。明日またお試しください" },
        { status: 429 }
      );
    }

    const tipSetting = await prisma.siteSetting.findUnique({ where: { key: "tips_enabled" } });
    if (tipSetting?.value === "false") {
      return NextResponse.json({ error: "投げ銭機能は現在無効です" }, { status: 403 });
    }

    const { workId, amount, message } = await request.json();

    if (!workId || typeof workId !== "string") {
      return NextResponse.json({ error: "作品IDが必要です" }, { status: 400 });
    }
    if (typeof amount !== "number" || !Number.isInteger(amount)) {
      return NextResponse.json(
        { error: "金額は整数で指定してください" },
        { status: 400 }
      );
    }
    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `金額は${MIN_AMOUNT}円〜${MAX_AMOUNT}円で指定してください` },
        { status: 400 }
      );
    }
    if (message && (typeof message !== "string" || message.length > 200)) {
      return NextResponse.json(
        { error: "メッセージは200文字以内で入力してください" },
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
    if (session.user.id === work.authorId) {
      return NextResponse.json(
        { error: "自分の作品には投げ銭できません" },
        { status: 400 }
      );
    }

    const platformFee = Math.floor(amount * PLATFORM_FEE_RATE);
    const netAmount = amount - platformFee;

    const [tip] = await prisma.$transaction([
      prisma.tip.create({
        data: {
          amount,
          platformFee,
          netAmount,
          message: message?.trim() || null,
          senderId: session.user.id,
          receiverId: work.authorId,
          workId: work.id,
          paymentStatus: "completed",
        },
        include: {
          sender: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.work.update({
        where: { id: workId },
        data: { tipTotal: { increment: amount } },
      }),
    ]);

    return NextResponse.json(tip, { status: 201 });
  } catch (error) {
    console.error("POST /api/tips error:", error);
    return NextResponse.json(
      { error: "投げ銭に失敗しました" },
      { status: 500 }
    );
  }
}
