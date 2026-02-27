"use client";

import Link from "next/link";
import { UserMenu } from "@/components/auth/UserMenu";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-komapara-border">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-primary-500">
          コマパラ
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/search"
            className="p-2 text-komapara-muted hover:text-komapara-text transition-colors"
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
              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
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
