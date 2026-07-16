"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useSearch } from "@/components/search/SearchContext";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { query, setQuery } = useSearch();

  if (pathname.startsWith("/admin") || pathname.startsWith("/lp")) return null;

  return (
    <header className="sticky top-0 z-50 bg-accent">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 sm:h-20 flex items-center justify-between">
        {/* Left: Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6 flex-1" aria-label="メインナビゲーション">
          <Link href="/ranking" className="text-sm font-medium text-white/75 hover:text-white transition-colors">
            ランキング
          </Link>
          <Link href="/genre/nichijou" className="text-sm font-medium text-white/75 hover:text-white transition-colors">
            ジャンル
          </Link>
          <Link href="/about" className="text-sm font-medium text-white/75 hover:text-white transition-colors">
            About
          </Link>
        </nav>

        {/* Center: Logo */}
        <Link href="/" className="text-xl sm:text-2xl font-bold text-white md:absolute md:left-1/2 md:-translate-x-1/2" aria-label="コマパラ ホーム">
          コマパラ
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 justify-end flex-1">
          {/* 検索（デスクトップ）。画面遷移させず、その場でフィードを絞り込む。
              ホーム以外で入力された場合だけホームへ戻して結果を見せる。 */}
          <div className="relative hidden md:block">
            <svg
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value && pathname !== "/") router.push("/");
              }}
              placeholder="作品・作家を検索"
              aria-label="作品・作家を検索"
              className="w-48 lg:w-64 pl-9 pr-3 py-2 text-sm bg-white rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/60 transition-all"
            />
          </div>

          <NotificationBell />

          <Link
            href="/upload"
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-accent bg-white rounded-xl shadow-sm hover:bg-blue-50 transition-colors"
          >
            + 投稿
          </Link>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
