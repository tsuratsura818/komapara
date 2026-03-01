import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NextAuth v5 のセッションクッキー名
const SESSION_COOKIE = "authjs.session-token";
const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get(SECURE_SESSION_COOKIE)?.value ||
    request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/upload/:path*", "/dashboard/:path*", "/settings/:path*", "/library/:path*", "/admin/:path*"],
};
