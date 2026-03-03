import Link from "next/link";
import type { Metadata } from "next";
import { ScrollAnimations } from "./ScrollAnimations";
import { AuroraBlobs } from "./AuroraBlobs";

export const metadata: Metadata = {
  title: "コマパラ - 4コマ漫画に特化したポータルサイト",
};

const PILLARS = [
  {
    emoji: "📖",
    title: "読む",
    description: "ジャンル別・ランキング・フォローで、好みの4コマがすぐ見つかる",
    features: ["ジャンル別閲覧", "週間ランキング", "無限スクロールフィード"],
    gradient: "from-purple-500 to-blue-500",
  },
  {
    emoji: "✏️",
    title: "描く",
    description: "画像をアップロードするだけ。X/Instagramからの1タップ連携も",
    features: ["かんたん投稿", "X/Instagram連携", "シリーズ管理"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    emoji: "🤝",
    title: "つながる",
    description: "5種リアクション・コメント・フォローで作家と読者がつながる",
    features: ["5種リアクション", "投げ銭・サブスク", "プッシュ通知"],
    gradient: "from-pink-500 to-purple-500",
  },
];

const READER_PROBLEMS = [
  {
    problem: "4コマが見つけにくい",
    before: "XのTLに流れて消える",
    after: "ジャンル別・ランキングで発見",
    icon: "🔍",
  },
  {
    problem: "まとめて読めない",
    before: "作家のアカウントを巡回",
    after: "フォロー機能で自動集約",
    icon: "📚",
  },
  {
    problem: "読み返せない",
    before: "TLを遡るしかない",
    after: "ライブラリで一元管理",
    icon: "🔖",
  },
  {
    problem: "シリーズが追えない",
    before: "投稿が時系列で埋もれる",
    after: "前後ナビ付き連載管理",
    icon: "📋",
  },
];

const CREATOR_FEATURES = [
  {
    title: "かんたん投稿",
    description: "画像ドラッグ&ドロップで最短30秒。X/Instagramからの1タップインポートも。",
    icon: "⚡",
  },
  {
    title: "ダッシュボード",
    description: "閲覧数・いいね・フォロワー・収益をリアルタイムで把握。",
    icon: "📊",
  },
  {
    title: "投げ銭",
    description: "読者からの応援金をメッセージ付きで受け取れる。",
    icon: "💰",
  },
  {
    title: "サブスクリプション",
    description: "月額課金プランを自由に設定。安定した収益基盤を構築。",
    icon: "🎫",
  },
];

const STEPS = [
  {
    step: "01",
    title: "アカウント作成",
    description: "Google・X・メールで無料登録。30秒で完了。",
  },
  {
    step: "02",
    title: "作品を楽しむ / 投稿する",
    description: "読者はフィードで4コマを発見。クリエイターはすぐに投稿開始。",
  },
  {
    step: "03",
    title: "つながる・応援する",
    description: "リアクション・コメント・投げ銭で、お気に入りの作家を応援。",
  },
];

const COMPARISONS = [
  { feature: "4コマ特化", komapara: true, pixiv: false, x: false },
  { feature: "SNS連携投稿", komapara: true, pixiv: false, x: false },
  { feature: "5種リアクション", komapara: true, pixiv: false, x: false },
  { feature: "投げ銭・サブスク", komapara: true, pixiv: true, x: false },
  { feature: "週間ランキング", komapara: true, pixiv: true, x: false },
  { feature: "シリーズ管理", komapara: true, pixiv: true, x: false },
  { feature: "プッシュ通知", komapara: true, pixiv: true, x: true },
];

const FAQS = [
  {
    q: "利用料金はかかりますか？",
    a: "基本無料です。読者もクリエイターも無料でご利用いただけます。広告非表示のプレミアムプラン（月額300円）もご用意しています。",
  },
  {
    q: "どうやって投稿しますか？",
    a: "4枚の画像をアップロードするだけ。X（旧Twitter）やInstagramの投稿を1タップでインポートすることもできます。",
  },
  {
    q: "収益化できますか？",
    a: "はい。読者からの投げ銭（手数料10%）やサブスクリプション（手数料15%）で収益を得ることができます。",
  },
  {
    q: "スマホで使えますか？",
    a: "はい。モバイルファーストで設計しており、PWA対応でアプリのように利用できます。プッシュ通知にも対応しています。",
  },
];

export default function LpPage() {
  return (
    <div className="overflow-hidden">
      <ScrollAnimations />

      {/* ===== Floating Header ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/" className="text-lg font-bold gradient-text">
            コマパラ
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-komapara-muted hover:text-komapara-text transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/login"
              className="text-sm px-4 py-1.5 bg-gradient-main text-white font-semibold rounded-full hover:opacity-90 transition-opacity"
            >
              無料ではじめる
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero (Animated Aurora Background) ===== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-14">
        <AuroraBlobs />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="text-base md:text-lg font-semibold text-gradient-purple tracking-wider mb-6 animate-fade-in">
            4コマ漫画に特化したポータルサイト
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.1] text-komapara-text animate-fade-in" style={{ animationDelay: "0.15s" }}>
            4コマの世界を、
            <br />
            <span className="gradient-text">もっと楽しく。</span>
          </h1>
          <p className="text-komapara-muted text-lg md:text-xl mt-8 max-w-xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: "0.3s" }}>
            XやInstagramに散らばる4コマ漫画を一箇所に。
            <br className="hidden md:block" />
            読者には発見を、クリエイターには届ける場所を。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 animate-fade-in" style={{ animationDelay: "0.45s" }}>
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 text-lg bg-gradient-main text-white font-bold rounded-full shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 text-center"
            >
              無料ではじめる
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-10 py-4 text-lg glass font-semibold rounded-full hover:shadow-md transition-all duration-300 text-center text-komapara-text"
            >
              くわしく見る
            </a>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-komapara-muted/50 animate-fade-in" style={{ animationDelay: "1s" }}>
          <span className="text-xs tracking-widest">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-komapara-muted/30 to-transparent" />
        </div>
      </section>

      {/* ===== Problem Section ===== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 lp-animate">
            <p className="text-sm font-semibold text-gradient-purple tracking-wider mb-2">PROBLEM</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              こんな経験、ありませんか？
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {READER_PROBLEMS.map((item, i) => (
              <div key={item.problem} className={`lp-animate lp-animate-delay-${Math.min(i + 1, 3)} glass rounded-xl p-5`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="font-bold text-base">{item.problem}</h3>
                    <p className="text-sm text-komapara-muted mt-1">
                      <span className="line-through opacity-60">{item.before}</span>
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      <span className="gradient-text">→ {item.after}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3 Pillars ===== */}
      <section id="features" className="py-20 px-4 relative">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 lp-animate">
            <p className="text-sm font-semibold text-gradient-purple tracking-wider mb-2">CONCEPT</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              読む・描く・つながる
            </h2>
            <p className="text-komapara-muted text-sm mt-3 max-w-md mx-auto">
              コマパラは3つの体験を1つのプラットフォームで実現します
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PILLARS.map((pillar, i) => (
              <div
                key={pillar.title}
                className={`lp-animate lp-animate-delay-${i + 1} glass rounded-2xl p-6 text-center relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${pillar.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
                <div className="text-4xl mb-4 relative">{pillar.emoji}</div>
                <h3
                  className={`font-bold text-xl relative bg-gradient-to-r ${pillar.gradient} bg-clip-text text-transparent`}
                >
                  {pillar.title}
                </h3>
                <p className="text-sm text-komapara-muted mt-2 relative">
                  {pillar.description}
                </p>
                <ul className="mt-4 space-y-1.5 relative">
                  {pillar.features.map((f) => (
                    <li key={f} className="text-xs text-komapara-muted flex items-center justify-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${pillar.gradient} inline-block`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== For Creators ===== */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 lp-animate">
            <p className="text-sm font-semibold text-gradient-purple tracking-wider mb-2">FOR CREATORS</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              クリエイターの味方
            </h2>
            <p className="text-komapara-muted text-sm mt-3 max-w-md mx-auto">
              投稿・分析・収益化がワンストップ。創作活動に集中できる環境を。
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREATOR_FEATURES.map((feature, i) => (
              <div key={feature.title} className={`lp-animate lp-animate-delay-${Math.min(i + 1, 3)} glass rounded-xl p-5 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
                <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                <div>
                  <h3 className="font-bold">{feature.title}</h3>
                  <p className="text-sm text-komapara-muted mt-1">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="py-20 px-4 relative">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 30% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 lp-animate">
            <p className="text-sm font-semibold text-gradient-purple tracking-wider mb-2">HOW IT WORKS</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              かんたん3ステップ
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className={`lp-animate lp-animate-delay-${i + 1} text-center relative`}>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-300 to-pink-300 opacity-30" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-main text-white font-bold text-lg mb-4 shadow-lg shadow-purple-500/20">
                  {s.step}
                </div>
                <h3 className="font-bold text-base">{s.title}</h3>
                <p className="text-sm text-komapara-muted mt-2">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Comparison ===== */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 lp-animate">
            <p className="text-sm font-semibold text-gradient-purple tracking-wider mb-2">COMPARISON</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              なぜコマパラ？
            </h2>
          </div>
          <div className="lp-animate glass rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-komapara-border">
                  <th className="text-left p-4 font-semibold">機能</th>
                  <th className="p-4 font-bold gradient-text">コマパラ</th>
                  <th className="p-4 font-semibold text-komapara-muted">pixiv</th>
                  <th className="p-4 font-semibold text-komapara-muted">X</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((row) => (
                  <tr key={row.feature} className="border-b border-komapara-border/50 last:border-0">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">{row.komapara ? "✅" : "—"}</td>
                    <td className="p-4 text-center">{row.pixiv ? "⚪" : "—"}</td>
                    <td className="p-4 text-center">{row.x ? "⚪" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 px-4 relative">
        <div
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 70% 50%, rgba(236,72,153,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 lp-animate">
            <p className="text-sm font-semibold text-gradient-purple tracking-wider mb-2">FAQ</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              よくある質問
            </h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className={`lp-animate lp-animate-delay-${Math.min(i + 1, 3)} glass rounded-xl p-5`}>
                <h3 className="font-bold flex items-start gap-2">
                  <span className="gradient-text flex-shrink-0">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-sm text-komapara-muted mt-2 pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA ===== */}
      <section className="relative py-24 px-4 text-center">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: [
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 20% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)",
              "radial-gradient(ellipse 60% 40% at 80% 20%, rgba(236,72,153,0.1) 0%, transparent 50%)",
            ].join(", "),
          }}
        />
        <div className="relative z-10 max-w-lg mx-auto lp-animate">
          <h2 className="text-3xl md:text-4xl font-bold">
            さあ、<span className="gradient-text">はじめよう</span>
          </h2>
          <p className="text-komapara-muted mt-4">
            登録は無料。今すぐお気に入りの4コマを探しに行こう。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-main text-white font-bold rounded-full shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 text-center"
            >
              無料ではじめる
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-3.5 glass font-semibold rounded-full hover:shadow-md transition-all duration-300 text-center text-komapara-text"
            >
              作品を見てみる
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-8 px-4 border-t border-komapara-border/50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-komapara-muted">
          <Link href="/" className="font-bold gradient-text text-base">
            コマパラ
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/about" className="hover:text-komapara-text transition-colors">
              コマパラについて
            </Link>
            <Link href="/" className="hover:text-komapara-text transition-colors">
              作品を見る
            </Link>
            <Link href="/login" className="hover:text-komapara-text transition-colors">
              ログイン
            </Link>
          </div>
          <p>&copy; 2026 コマパラ</p>
        </div>
      </footer>
    </div>
  );
}
