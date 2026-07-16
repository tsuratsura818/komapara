import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // NextAuth v5 のセッションクッキーを検索（バージョンや環境で名前が変わるため全パターンチェック）
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.includes("session-token") && c.value
  );

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/dashboard/:path*", "/settings/:path*", "/library/:path*", "/admin/:path*"],
};
