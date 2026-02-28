import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// プッシュ通知サブスクリプション登録
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { endpoint, keys } = await request.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "無効なサブスクリプションデータです" },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: session.user.id,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notifications/subscribe error:", error);
    return NextResponse.json(
      { error: "サブスクリプション登録に失敗しました" },
      { status: 500 }
    );
  }
}

// プッシュ通知サブスクリプション解除
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json(
        { error: "endpointが必要です" },
        { status: 400 }
      );
    }

    await prisma.pushSubscription
      .delete({ where: { endpoint } })
      .catch(() => {});

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/notifications/subscribe error:", error);
    return NextResponse.json(
      { error: "サブスクリプション解除に失敗しました" },
      { status: 500 }
    );
  }
}
