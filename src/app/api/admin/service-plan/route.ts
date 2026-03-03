import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";

export async function GET() {
  const { error } = await requireAdminApi();
  if (error) return error;

  const html = readFileSync(
    join(process.cwd(), "docs", "service-plan.html"),
    "utf-8"
  );

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
