import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "コマパラについて",
};

const FEATURES = [
  {
    emoji: "📖",
    title: "読む",
    description: "多彩なクリエイターの4コマ漫画をいつでもどこでも楽しめます",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    emoji: "✏️",
    title: "描く",
    description: "4枚の画像をアップロードするだけで簡単に作品を公開できます",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    emoji: "💬",
    title: "つながる",
    description: "いいね・コメント・フォローで作家と読者がつながります",
    gradient: "from-pink-500 to-purple-500",
  },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-main px-4 py-16 text-white text-center">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold leading-tight">
            4コマの世界を、
            <br />
            もっと楽しく
          </h1>
          <p className="text-white/80 text-sm mt-3 max-w-xs mx-auto">
            コマパラは4コマ漫画に特化した読者向けポータルサイトです。
            お気に入りの作品を見つけて、作家をフォローしましょう。
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 px-6 py-2.5 bg-white text-purple-600 font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          >
            無料ではじめる
          </Link>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-8 w-20 h-20 bg-white/10 rounded-lg rotate-12 animate-float" />
        <div
          className="absolute bottom-8 right-20 w-14 h-14 bg-white/10 rounded-lg -rotate-6 animate-float"
        />
        <div
          className="absolute top-12 left-8 w-10 h-10 bg-white/5 rounded-lg rotate-45 animate-float"
        />
      </section>

      {/* Features */}
      <section className="px-4 py-10">
        <h2 className="text-lg font-bold gradient-text text-center mb-6">
          コマパラでできること
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className="glass rounded-xl p-5 text-center relative overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`}
              />
              <div className="text-3xl mb-3 relative">{feature.emoji}</div>
              <h3
                className={`font-bold text-lg relative bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
              >
                {feature.title}
              </h3>
              <p className="text-sm text-komapara-muted mt-2 relative">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-10 text-center">
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-bold gradient-text">
            さあ、はじめよう
          </h2>
          <p className="text-sm text-komapara-muted mt-2">
            登録は無料。今すぐお気に入りの4コマを探しに行こう。
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 px-6 py-2.5 bg-gradient-main text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-200"
          >
            無料ではじめる
          </Link>
        </div>
      </section>
    </div>
  );
}
