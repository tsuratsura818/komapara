import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { error } = await requireAdminApi();
  if (error) return error;

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
