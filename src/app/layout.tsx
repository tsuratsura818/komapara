import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/auth/Providers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "コマパラ - 4コマ漫画ポータル",
    template: "%s | コマパラ",
  },
  description:
    "4コマ漫画に特化した読者向けポータルサイト。お気に入りの4コマを見つけよう！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-komapara-bg text-komapara-text`}
      >
        {/* Gradient mesh background */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
        </div>
        <Providers>
          <Header />
          <main className="max-w-3xl mx-auto pb-16 md:pb-0">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
