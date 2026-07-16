"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function Header() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin") || pathname.startsWith("/lp")) return null;

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
        {/* Left: Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6 flex-1" aria-label="メインナビゲーション">
          <Link href="/ranking" className="text-sm text-komapara-muted hover:text-komapara-text transition-colors">
            ランキング
          </Link>
          <Link href="/genre/nichijou" className="text-sm text-komapara-muted hover:text-komapara-text transition-colors">
            ジャンル
          </Link>
          <Link href="/about" className="text-sm text-komapara-muted hover:text-komapara-text transition-colors">
            About
          </Link>
        </nav>

        {/* Center: Logo */}
        <Link href="/" className="text-xl font-bold gradient-text md:absolute md:left-1/2 md:-translate-x-1/2" aria-label="コマパラ ホーム">
          コマパラ
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 justify-end flex-1">
          <NotificationBell />
          <Link
            href="/search"
            className="p-2 text-komapara-muted hover:text-gradient-purple transition-colors"
            aria-label="検索"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Link>

          <Link
            href="/upload"
            className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-main rounded-xl shadow-xs shadow-purple-500/20 hover:shadow-md hover:shadow-purple-500/30 hover:-translate-y-px transition-all duration-150"
          >
            + 投稿
          </Link>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
