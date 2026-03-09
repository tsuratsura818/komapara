import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.formData().catch(() => null);
  const status = body?.get("status") as string | null;

  if (!status || !["reviewed", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "不正なステータス" }, { status: 400 });
  }

  await prisma.report.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.redirect(new URL("/admin/reports", request.url));
}
