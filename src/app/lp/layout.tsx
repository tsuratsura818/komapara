import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "コマパラ - 4コマ漫画に特化したポータルサイト",
  description:
    "XやInstagramに散らばる4コマ漫画を一箇所に。読者には「いつでもサクッと楽しめる4コマ体験」を、クリエイターには「作品を届ける場所と収益化の手段」を提供します。",
  openGraph: {
    title: "コマパラ - 4コマの世界を、もっと楽しく",
    description:
      "4コマ漫画に特化した「読む・描く・つながる」プラットフォーム。無料で今すぐはじめよう。",
    type: "website",
  },
};

export default function LpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", paddingBottom: 0 }}
    >
      {children}
    </div>
  );
}
