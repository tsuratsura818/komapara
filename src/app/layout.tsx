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
        <Providers>
          <Header />
          <main className="max-w-3xl mx-auto pb-16 md:pb-0">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
