import Link from "next/link";
import type { Metadata } from "next";
import { ScrollAnimations } from "./ScrollAnimations";
import { AuroraBlobs } from "./AuroraBlobs";
import {
  BookOpenIcon, PencilSquareIcon, UsersIcon,
  MagnifyingGlassIcon, RectangleStackIcon, BookmarkIcon, ListBulletIcon,
  BoltIcon, ChartBarIcon, BanknotesIcon, TicketIcon,
  FaceSmileIcon, TrophyIcon, TagIcon, SparklesIcon,
} from "./Icons";

export const metadata: Metadata = {
  title: "コマパラ — 4コマ漫画ポータルサイト",
  description: "XやInstagramに散らばる4コマ漫画を一箇所に集約。読者もクリエイターも無料で今すぐはじめよう。",
};

const PILLARS = [
  {
    Icon: BookOpenIcon,
    title: "読む",
    description: "ジャンル別・ランキング・フォローで、好みの4コマがすぐ見つかる",
    features: ["ジャンル別閲覧", "週間ランキング", "無限スクロールフィード"],
    gradient: "from-purple-500 to-blue-500",
  },
  {
    Icon: PencilSquareIcon,
    title: "描く",
    description: "画像をアップロードするだけ。X/Instagramからの1タップ連携も",
    features: ["かんたん投稿", "X/Instagram連携", "シリーズ管理"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    Icon: UsersIcon,
    title: "つながる",
    description: "5種リアクション・コメント・フォローで作家と読者がつながる",
    features: ["5種リアクション", "投げ銭・サブスク", "プッシュ通知"],
    gradient: "from-pink-500 to-purple-500",
  },
];

const READER_PROBLEMS = [
  { problem: "4コマが見つけにくい", before: "XのTLに流れて消える", after: "ジャンル別・ランキングで発見", Icon: MagnifyingGlassIcon },
  { problem: "まとめて読めない", before: "作家のアカウントを巡回", after: "フォロー機能で自動集約", Icon: RectangleStackIcon },
  { problem: "読み返せない", before: "TLを遡るしかない", after: "ライブラリで一元管理", Icon: BookmarkIcon },
  { problem: "シリーズが追えない", before: "投稿が時系列で埋もれる", after: "前後ナビ付き連載管理", Icon: ListBulletIcon },
];

const CREATOR_FEATURES = [
  { title: "かんたん投稿", description: "画像ドラッグ&ドロップで最短30秒。X/Instagramからの1タップインポートも。", Icon: BoltIcon },
  { title: "ダッシュボード", description: "閲覧数・いいね・フォロワー・収益をリアルタイムで把握。", Icon: ChartBarIcon },
  { title: "投げ銭", description: "読者からの応援金をメッセージ付きで受け取れる。", Icon: BanknotesIcon },
  { title: "サブスクリプション", description: "月額課金プランを自由に設定。安定した収益基盤を構築。", Icon: TicketIcon },
];

const STEPS = [
  { step: "01", title: "アカウント作成", description: "Google・X・メールで無料登録。30秒で完了。" },
  { step: "02", title: "作品を楽しむ / 投稿する", description: "読者はフィードで4コマを発見。クリエイターはすぐに投稿開始。" },
  { step: "03", title: "つながる・応援する", description: "リアクション・コメント・投げ銭で、お気に入りの作家を応援。" },
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

const TESTIMONIALS = [
  {
    name: "まるまる🐾",
    role: "クリエイター・ねこ日和 作者",
    avatar: "🐱",
    text: "XとInstagramにバラバラに上げていた4コマを、コマパラに集約したら新しい読者さんが増えました。1タップインポートが本当に楽！",
    gradient: "from-purple-200 to-blue-200",
  },
  {
    name: "OL漫画家 りえ",
    role: "クリエイター・OLあるある 作者",
    avatar: "💼",
    text: "投げ銭で初めて応援をもらった時は感動しました。創作を続けるモチベーションが全然違います。ダッシュボードで数字が見えるのも嬉しい。",
    gradient: "from-pink-200 to-purple-200",
  },
  {
    name: "たけし@通勤読書派",
    role: "読者",
    avatar: "🚃",
    text: "通勤時間に毎日5作品は読んでいます。ジャンルで絞れるから好みの4コマがすぐ見つかる。プッシュ通知で新作も見逃さない！",
    gradient: "from-blue-200 to-cyan-200",
  },
  {
    name: "ねこ好きママ",
    role: "読者",
    avatar: "🐈",
    text: "育児系の4コマを探していたら、ジャンルを選ぶだけで大量に出てきて感動。シリーズ機能で最初から全部追えるのが最高です！",
    gradient: "from-yellow-200 to-orange-200",
  },
];

const PRICING_PLANS = [
  {
    name: "フリー",
    price: "¥0",
    period: "",
    description: "読者もクリエイターも、基本機能はすべて無料",
    features: [
      "フィード・ランキング・ジャンル閲覧",
      "作品投稿・シリーズ管理",
      "いいね・コメント・フォロー",
      "5種リアクションスタンプ",
      "クリエイターダッシュボード",
      "投げ銭・サブスク受取",
    ],
    cta: "無料ではじめる",
    featured: false,
  },
  {
    name: "プレミアム",
    price: "¥300",
    period: "/ 月",
    description: "広告なしの快適な読書体験を",
    features: [
      "フリープランの全機能",
      "広告完全非表示",
      "プレミアムバッジ表示",
      "優先サポート",
    ],
    cta: "プレミアムへ",
    featured: true,
  },
];

const FAQS = [
  { q: "利用料金はかかりますか？", a: "基本無料です。読者もクリエイターも無料でご利用いただけます。広告非表示のプレミアムプラン（月額300円）もご用意しています。" },
  { q: "どうやって投稿しますか？", a: "4枚の画像をアップロードするだけ。X（旧Twitter）やInstagramの投稿を1タップでインポートすることもできます。" },
  { q: "収益化できますか？", a: "はい。読者からの投げ銭（手数料10%）やサブスクリプション（手数料15%）で収益を得ることができます。" },
  { q: "スマホで使えますか？", a: "はい。モバイルファーストで設計しており、PWA対応でアプリのように利用できます。プッシュ通知にも対応しています。" },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 10 8">
      <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LpPage() {
  return (
    <div className="overflow-hidden">
      <ScrollAnimations />

      {/* ===== Header ===== */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="text-base font-black gradient-text tracking-tight">
            コマパラ
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
            <a href="#features" className="hover:text-gray-900 transition-colors">機能</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">料金</a>
            <Link href="/about" className="hover:text-gray-900 transition-colors">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
              ログイン
            </Link>
            <Link
              href="/login"
              className="text-sm px-5 py-2 bg-gradient-main text-white font-bold rounded-xl hover:opacity-90 hover:-translate-y-px transition-all duration-150 shadow-xs shadow-purple-500/20"
            >
              無料ではじめる
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative min-h-screen flex items-center px-6 overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
        <AuroraBlobs />
        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 lg:gap-8 items-center">

          {/* 左：コピー + CTA */}
          <div>
            <div className="badge-glass animate-fade-in mb-8 inline-flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              4コマ漫画に特化したポータルサイト
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.93] tracking-tight text-gray-900 animate-fade-in"
              style={{ animationDelay: "0.12s" }}
            >
              4コマの世界を、
              <br />
              <span className="gradient-text">もっと楽しく。</span>
            </h1>

            <p
              className="text-gray-500 text-lg mt-8 max-w-md leading-relaxed animate-fade-in"
              style={{ animationDelay: "0.24s" }}
            >
              笑える、泣ける、共感できる。<br />
              あなたの「好き」が、きっと見つかる。
            </p>

            <div className="flex flex-wrap gap-2 mt-7 animate-fade-in" style={{ animationDelay: "0.36s" }}>
              {[
                { label: "無限スクロールフィード", Icon: BookOpenIcon },
                { label: "SNS 1タップ連携", Icon: BoltIcon },
                { label: "5種リアクション", Icon: FaceSmileIcon },
                { label: "投げ銭・収益化", Icon: BanknotesIcon },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/90 border border-gray-200 rounded-full text-gray-600 shadow-xs font-medium backdrop-blur-xs"
                >
                  <chip.Icon className="w-3.5 h-3.5" />{chip.label}
                </span>
              ))}
            </div>

            <div
              className="flex flex-col sm:flex-row items-start gap-3 mt-10 animate-fade-in"
              style={{ animationDelay: "0.48s" }}
            >
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 text-base bg-gradient-main text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35 hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                無料ではじめる →
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-2xl border border-gray-200/80 bg-white/80 text-gray-700 hover:border-purple-300 hover:text-purple-700 transition-all duration-200 text-center backdrop-blur-xs"
              >
                機能を見る
              </a>
            </div>

            <p className="mt-5 text-sm text-gray-400 animate-fade-in" style={{ animationDelay: "0.56s" }}>
              🎉 クレジットカード不要 · 登録30秒 · 完全無料
            </p>
          </div>

          {/* 右：Phone mockup */}
          <div
            className="relative flex items-center justify-center animate-fade-in"
            style={{ animationDelay: "0.4s", minHeight: "360px" }}
          >
            <div className="absolute -top-4 left-[6%] z-20 glass-card rounded-2xl px-4 py-3 animate-float hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-yellow-400 to-orange-400 flex items-center justify-center shrink-0">
                  <TrophyIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xs">週間1位獲得</div>
                  <div className="text-gray-400 text-[10px]">今日のひとコマ</div>
                </div>
              </div>
            </div>
            <div
              className="absolute -bottom-2 right-[2%] z-20 glass-card rounded-2xl px-4 py-3 hidden sm:block"
              style={{ animation: "float 5s ease-in-out infinite 1.5s" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center shrink-0">
                  <FaceSmileIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xs">+128 リアクション</div>
                  <div className="text-gray-400 text-[10px]">ねこ日和 #12</div>
                </div>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/phone-mockup.png"
              alt="コマパラ アプリ画面"
              className="w-full sm:w-[130%] sm:max-w-none sm:translate-x-[5%]"
              style={{
                mixBlendMode: "multiply",
                display: "block",
                pointerEvents: "none",
                userSelect: "none",
              }}
            />
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400">
          <span className="text-[10px] tracking-[0.2em] font-medium">SCROLL</span>
          <div className="w-px h-8 bg-linear-to-b from-gray-300 to-transparent" />
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="py-14 px-6 bg-white border-y border-gray-100/80">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: "500+", label: "投稿作品数", Icon: RectangleStackIcon, gradient: "from-purple-500 to-blue-500" },
            { value: "100+", label: "クリエイター", Icon: PencilSquareIcon, gradient: "from-blue-500 to-cyan-500" },
            { value: "15", label: "ジャンル", Icon: TagIcon, gradient: "from-pink-500 to-purple-500" },
            { value: "¥0", label: "基本利用料", Icon: SparklesIcon, gradient: "from-green-400 to-teal-500" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`feature-card p-5 md:p-6 text-center lp-animate lp-animate-delay-${Math.min(i + 1, 3)}`}
            >
              <div className={`w-8 h-8 mx-auto mb-3 bg-linear-to-r ${stat.gradient} rounded-lg flex items-center justify-center`}>
                <stat.Icon className="w-4 h-4 text-white" />
              </div>
              <div className={`text-3xl md:text-4xl font-black bg-linear-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Problem ===== */}
      <section className="py-24 px-6 bg-komapara-bg">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">PROBLEM</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">こんな経験、ありませんか？</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {READER_PROBLEMS.map((item, i) => (
              <div
                key={item.problem}
                className={`feature-card p-7 lp-animate lp-animate-delay-${Math.min(i + 1, 3)}`}
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                  <item.Icon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">{item.problem}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-400 rounded-md border border-red-100 shrink-0">Before</span>
                    <span className="text-sm text-gray-400 line-through">{item.before}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100 shrink-0">After</span>
                    <span className="text-sm font-semibold text-gray-800">{item.after}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pillars ===== */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">CONCEPT</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">読む・描く・つながる</h2>
            <p className="text-gray-500 mt-4 max-w-md mx-auto text-sm leading-relaxed">
              コマパラは3つの体験を1つのプラットフォームで実現します
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PILLARS.map((pillar, i) => (
              <div
                key={pillar.title}
                className={`feature-card p-8 lp-animate lp-animate-delay-${i + 1} group hover:-translate-y-1`}
              >
                <div className={`h-0.5 w-14 rounded-full bg-linear-to-r ${pillar.gradient} mb-7`} />
                <div className={`w-12 h-12 rounded-2xl bg-linear-to-r ${pillar.gradient} flex items-center justify-center mb-4`}>
                  <pillar.Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-2xl font-black bg-linear-to-r ${pillar.gradient} bg-clip-text text-transparent mb-3`}>
                  {pillar.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{pillar.description}</p>
                <ul className="space-y-2.5">
                  {pillar.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <span className={`w-4 h-4 rounded-full bg-linear-to-r ${pillar.gradient} flex items-center justify-center shrink-0`}>
                        <CheckIcon className="w-2.5 h-2.5 text-white" />
                      </span>
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
      <section className="py-24 px-6 bg-komapara-bg">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">FOR CREATORS</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">クリエイターの味方</h2>
            <p className="text-gray-500 mt-4 max-w-sm mx-auto text-sm leading-relaxed">
              投稿・分析・収益化がワンストップ。創作活動に集中できる環境を。
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREATOR_FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className={`feature-card p-7 lp-animate lp-animate-delay-${Math.min(i + 1, 3)} flex items-start gap-5`}
              >
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-purple-50 to-blue-50 border border-purple-100/50 flex items-center justify-center shrink-0">
                  <feature.Icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">VOICES</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">ユーザーの声</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className={`feature-card p-7 lp-animate lp-animate-delay-${Math.min(i + 1, 3)}`}>
                <svg className="w-7 h-7 text-purple-200 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-linear-to-br ${t.gradient} flex items-center justify-center text-base shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works ===== */}
      <section className="py-24 px-6 bg-komapara-bg">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">HOW IT WORKS</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">かんたん3ステップ</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.step} className={`lp-animate lp-animate-delay-${i + 1} text-center relative`}>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[62%] w-[76%] h-px bg-linear-to-r from-purple-200 to-pink-200" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-purple-500 to-blue-500 text-white font-black text-xl mb-5 shadow-lg shadow-purple-500/20">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-sm">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Comparison ===== */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">COMPARISON</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">なぜコマパラ？</h2>
          </div>
          <div className="feature-card overflow-x-auto lp-animate">
            <table className="w-full text-sm min-w-[360px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left p-3 sm:p-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">機能</th>
                  <th className="p-3 sm:p-5 text-center">
                    <span className="gradient-text font-black text-sm sm:text-base">コマパラ</span>
                  </th>
                  <th className="p-3 sm:p-5 text-center font-medium text-gray-400 text-xs">pixiv</th>
                  <th className="p-3 sm:p-5 text-center font-medium text-gray-400 text-xs">X</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISONS.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-gray-50 last:border-0 ${i % 2 !== 0 ? "bg-komapara-bg" : ""}`}>
                    <td className="p-3 sm:p-4 font-medium text-gray-700 text-sm">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.komapara
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600"><CheckIcon className="w-3 h-3" /></span>
                        : <span className="text-gray-200 text-lg leading-none">—</span>}
                    </td>
                    <td className="p-4 text-center">
                      {row.pixiv ? <span className="text-gray-400 font-medium">△</span> : <span className="text-gray-200 text-lg leading-none">—</span>}
                    </td>
                    <td className="p-4 text-center">
                      {row.x ? <span className="text-gray-400 font-medium">△</span> : <span className="text-gray-200 text-lg leading-none">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== Pricing ===== */}
      <section id="pricing" className="py-24 px-6 bg-komapara-bg">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">PRICING</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">シンプルな料金体系</h2>
            <p className="text-gray-500 mt-4 text-sm">基本機能はすべて無料。いつでも始められます。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PRICING_PLANS.map((plan, i) => (
              <div
                key={plan.name}
                className={`lp-animate lp-animate-delay-${i + 1} rounded-2xl overflow-hidden ${
                  plan.featured
                    ? "ring-2 ring-purple-400/60 shadow-xl shadow-purple-500/10"
                    : "feature-card"
                }`}
              >
                {plan.featured && (
                  <div className="bg-gradient-main text-white text-xs font-bold text-center py-2 tracking-wider">
                    ✦ おすすめ
                  </div>
                )}
                <div className="bg-white p-7">
                  <h3 className={`text-lg font-black ${plan.featured ? "gradient-text" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-3 mb-1">
                    <span className={`text-5xl font-black ${plan.featured ? "gradient-text" : "text-gray-900"}`}>
                      {plan.price}
                    </span>
                    {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-400 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.featured ? "bg-purple-100" : "bg-gray-100"}`}>
                          <CheckIcon className={`w-2.5 h-2.5 ${plan.featured ? "text-purple-600" : "text-gray-500"}`} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login"
                    className={`block text-center py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      plan.featured
                        ? "bg-gradient-main text-white hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-px"
                        : "border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">よくある質問</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className={`feature-card p-6 lp-animate lp-animate-delay-${Math.min(i + 1, 3)}`}>
                <h3 className="font-bold text-gray-900 flex items-start gap-3 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">Q</span>
                  {faq.q}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed pl-9">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Final CTA (DARK) ===== */}
      <section className="relative py-32 px-6 text-center overflow-hidden bg-gray-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.35),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_70%,rgba(59,130,246,0.18),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_70%,rgba(236,72,153,0.15),transparent)]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto lp-animate">
          <span className="badge-dark inline-flex mb-8">✦ 今すぐはじめよう</span>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-[1.05] mb-6">
            4コマの世界へ、<br />
            <span className="gradient-text">ようこそ。</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            登録30秒・完全無料。<br className="sm:hidden" />
            今すぐお気に入りの4コマを探しに行こう。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 text-lg bg-gradient-main text-white font-bold rounded-2xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
            >
              無料ではじめる →
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto px-10 py-4 text-base font-semibold text-gray-400 hover:text-white transition-colors text-center"
            >
              まず作品を見てみる ↗
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-950 border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="font-black gradient-text text-lg tracking-tight">
            コマパラ
          </Link>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-sm text-gray-500">
            <Link href="/about" className="hover:text-gray-300 transition-colors">コマパラについて</Link>
            <Link href="/" className="hover:text-gray-300 transition-colors">作品を見る</Link>
            <Link href="/login" className="hover:text-gray-300 transition-colors">ログイン</Link>
          </div>
          <p className="text-sm text-gray-600">&copy; 2026 コマパラ</p>
        </div>
      </footer>
    </div>
  );
}
