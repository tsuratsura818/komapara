import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/auth/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PushPermission } from "@/components/notifications/PushPermission";
import { Analytics } from "@vercel/analytics/next";
import { siteJsonLd, jsonLdScript, ENTITY_DESCRIPTION } from "@/lib/structured-data";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://komapara.com"),
  title: {
    default: "コマパラ - 4コマ漫画ポータル",
    template: "%s | コマパラ",
  },
  description:
    ENTITY_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "コマパラ",
  },
  openGraph: {
    type: "website",
    siteName: "コマパラ",
    title: "コマパラ - 4コマ漫画ポータル",
    description: ENTITY_DESCRIPTION,
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "コマパラ - 4コマ漫画ポータル",
    description: ENTITY_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} font-sans antialiased bg-komapara-bg text-komapara-text`}
      >
        {/* 地。単一アクセント青のみの静かな靄（紫・ピンクは方針外のため廃止） */}
        <div
          className="fixed inset-0 -z-10 pointer-events-none"
          style={{
            backgroundImage: [
              'radial-gradient(ellipse at 15% 10%, rgba(37,99,235,0.05) 0%, transparent 50%)',
              'radial-gradient(ellipse at 85% 85%, rgba(37,99,235,0.04) 0%, transparent 50%)',
            ].join(', '),
          }}
        />

        {/* コマパラという実体をAIに定義する（全ページ） */}
        <script {...jsonLdScript(siteJsonLd())} />

        {/* AdSense 配信スクリプト。IDが設定されている本番のみ読み込む。
            これが無いと <ins class="adsbygoogle"> は空のまま描画されない */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            id="adsbygoogle-init"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            crossOrigin="anonymous"
          />
        )}

        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-100 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-komapara-text focus:rounded-lg focus:shadow-lg"
          >
            メインコンテンツへスキップ
          </a>
          <Header />
          <PushPermission />
          <main id="main-content" className="max-w-7xl mx-auto pb-16 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
          <ServiceWorkerRegister />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
