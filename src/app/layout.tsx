import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/auth/Providers";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PushPermission } from "@/components/notifications/PushPermission";

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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "コマパラ",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c5bf0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} font-sans antialiased bg-komapara-bg text-komapara-text`}
      >
        {/* Aurora gradient background */}
        <div
          className="fixed inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage: [
              'radial-gradient(ellipse at 15% 10%, rgba(139,92,246,0.08) 0%, transparent 50%)',
              'radial-gradient(ellipse at 85% 20%, rgba(59,130,246,0.06) 0%, transparent 45%)',
              'radial-gradient(ellipse at 50% 50%, rgba(236,72,153,0.05) 0%, transparent 50%)',
              'radial-gradient(ellipse at 20% 80%, rgba(59,130,246,0.06) 0%, transparent 45%)',
              'radial-gradient(ellipse at 80% 90%, rgba(139,92,246,0.07) 0%, transparent 50%)',
            ].join(', '),
          }}
        />
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-komapara-text focus:rounded-lg focus:shadow-lg"
          >
            メインコンテンツへスキップ
          </a>
          <Header />
          <PushPermission />
          <main id="main-content" className="max-w-7xl mx-auto pb-16 md:pb-0">{children}</main>
          <BottomNav />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
