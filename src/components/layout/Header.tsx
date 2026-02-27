"use client";

import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/20">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold gradient-text">
          コマパラ
        </Link>

        <div className="flex items-center gap-3">
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

          {session?.user && (
            <Link
              href="/upload"
              className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-main rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
            >
              + 投稿
            </Link>
          )}

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
