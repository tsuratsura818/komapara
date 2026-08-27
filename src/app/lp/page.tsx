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
  title: "コマパラ — 4コマ作家のための発表・収益化プラットフォーム",
  description: "XやInstagramに埋もれる4コマを、集約して新しい読者に届ける。1タップ投稿・ダッシュボードまで、ぜんぶ無料。",
};

const PILLARS = [
  {
    Icon: BookOpenIcon,
    title: "読む",
    description: "ジャンル別・ランキング・フォローで、好みの4コマがすぐ見つかる",
    features: ["ジャンル別閲覧", "週間ランキング", "無限スクロールフィード"],
    gradient: "from-blue-500 to-blue-500",
  },
  {
    Icon: PencilSquareIcon,
    title: "描く",
    description: "画像をアップロードするだけ。X/Instagramからの1タップ連携も",
    features: ["かんたん投稿", "X/Instagram連携", "シリーズ管理"],
    gradient: "from-blue-500 to-blue-500",
  },
  {
    Icon: UsersIcon,
    title: "つながる",
    description: "5種リアクション・コメント・フォローで作家と読者がつながる",
    features: ["5種リアクション", "クリエイター還元", "プッシュ通知"],
    gradient: "from-blue-500 to-blue-500",
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
  { title: "ダッシュボード", description: "閲覧数・いいね・フォロワーをリアルタイムで把握。", Icon: ChartBarIcon },
  { title: "クリエイター還元", description: "読まれた分だけ収益に。プレミアム会員費を閲覧数に応じて還元する仕組みを準備中。", Icon: BanknotesIcon },
  { title: "シリーズ管理", description: "連載を前後ナビ付きで管理。読者が最初から追える。", Icon: TicketIcon },
];

const STEPS = [
  { step: "01", title: "アカウント作成", description: "Google・X・メールで無料登録。30秒で完了。" },
  { step: "02", title: "作品を楽しむ / 投稿する", description: "読者はフィードで4コマを発見。クリエイターはすぐに投稿開始。" },
  { step: "03", title: "つながる・応援する", description: "リアクション・コメント・フォローで、お気に入りの作家を応援。" },
];

const COMPARISONS = [
  { feature: "4コマ特化", komapara: true, pixiv: false, x: false },
  { feature: "SNS連携投稿", komapara: true, pixiv: false, x: false },
  { feature: "5種リアクション", komapara: true, pixiv: false, x: false },
  { feature: "クリエイター還元", komapara: true, pixiv: true, x: false },
  { feature: "週間ランキング", komapara: true, pixiv: true, x: false },
  { feature: "シリーズ管理", komapara: true, pixiv: true, x: false },
  { feature: "プッシュ通知", komapara: true, pixiv: true, x: true },
];

/** ベータの実態。読者数や利用者の声を演出しない */
const BETA_FACTS = [
  {
    title: "作家はまだ1名です",
    text: "「おくり狼のアオン」の作品を公開しています。お声がけした方から順にご参加いただいている段階です。",
  },
  {
    title: "不具合が出ることがあります",
    text: "見つけ次第すぐに直します。お問い合わせからご連絡いただければ対応します。",
  },
  {
    title: "収益機能はまだ有効にしていません",
    text: "クリエイターへの収益還元（プレミアム会員費を、読まれた分に応じて配分する仕組み）を準備中です。決済まわりを整えたうえで公開し、事前にご案内します。",
  },
  {
    title: "Instagram連携は審査中です",
    text: "Metaの審査を申請中です。いまはXからの取り込みと、画像の直接アップロードがお使いいただけます。",
  },
];

/**
 * 有料機能は実装済みだが、いずれも現時点では有効にしていない。
 * 使えないものを「おすすめ」として売らないため、準備中を明示する。
 */
const PRICING_PLANS = [
  {
    name: "フリー",
    price: "¥0",
    period: "",
    description: "いま使えるのはこちらです。読者もクリエイターも無料",
    features: [
      "フィード・ランキング・ジャンル閲覧",
      "作品投稿・シリーズ管理",
      "いいね・コメント・フォロー",
      "5種リアクションスタンプ",
      "クリエイターダッシュボード",
      "Xからのインポート・画像アップロード",
    ],
    cta: "無料ではじめる",
    featured: true,
    upcoming: false,
  },
  {
    name: "プレミアム",
    price: "¥300",
    period: "/ 月",
    description: "広告を出し始めたタイミングで開放します",
    features: [
      "フリープランの全機能",
      "広告非表示",
      "プレミアムバッジ表示",
      "優先サポート",
    ],
    cta: "いまは登録できません",
    featured: false,
    upcoming: true,
  },
];

const FAQS = [
  { q: "利用料金はかかりますか？", a: "無料です。いま提供している機能はすべて無料でお使いいただけます。広告非表示のプレミアムプラン（月額300円）も用意していますが、まだ開放していません。" },
  { q: "どうやって投稿しますか？", a: "4枚の画像をアップロードするだけ。X（旧Twitter）の投稿を1タップでインポートすることもできます。Instagramからの取り込みはMetaの審査を申請中で、通り次第ご案内します。" },
  { q: "収益化できますか？", a: "クリエイターへの収益還元の仕組みを準備中です。読者が支払うプレミアム会員費を、作品の閲覧数に応じてクリエイターへ配分する形を予定しています。決済の整備が済み次第、公開してご案内します。" },
  { q: "広告は表示されますか？", a: "いまは表示していません。将来的に広告を掲載する場合は、事前にお知らせしたうえで、非表示にできるプレミアムプランを同時に開放します。" },
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
              className="text-sm px-5 py-2 bg-gradient-main text-white font-bold rounded-xl hover:opacity-90 hover:-translate-y-px transition-all duration-150 shadow-xs shadow-blue-500/20"
            >
              作家として参加
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
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              4コマ作家のための発表・収益化プラットフォーム
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.93] tracking-tight text-gray-900 animate-fade-in"
              style={{ animationDelay: "0.12s" }}
            >
              あなたの4コマに、
              <br />
              <span className="gradient-text">新しい読者を。</span>
            </h1>

            <p
              className="text-gray-500 text-lg mt-8 max-w-md leading-relaxed animate-fade-in"
              style={{ animationDelay: "0.24s" }}
            >
              XやInstagramに埋もれる作品を、集約して届ける。<br />
              投稿も、分析も、収益化も、ぜんぶ無料。
            </p>

            <div className="flex flex-wrap gap-2 mt-7 animate-fade-in" style={{ animationDelay: "0.36s" }}>
              {[
                { label: "SNS 1タップ連携", Icon: BoltIcon },
                { label: "ダッシュボード分析", Icon: ChartBarIcon },
                { label: "クリエイター還元", Icon: BanknotesIcon },
                { label: "完全無料", Icon: SparklesIcon },
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
                className="w-full sm:w-auto px-8 py-4 text-base bg-gradient-main text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all duration-200 text-center"
              >
                作家として参加 →
              </Link>
              <a
                href="#creators"
                className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-2xl border border-gray-200/80 bg-white/80 text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 text-center backdrop-blur-xs"
              >
                作家メリットを見る
              </a>
            </div>

            <p className="mt-5 text-sm text-gray-400 animate-fade-in" style={{ animationDelay: "0.56s" }}>
              🎉 登録30秒 · 完全無料 · SNSからそのままインポート
            </p>
          </div>

          {/* 右：Phone mockup */}
          <div
            className="relative flex items-center justify-center animate-fade-in"
            style={{ animationDelay: "0.4s", minHeight: "360px" }}
          >
            <div className="absolute -top-4 left-[6%] z-20 glass-card rounded-2xl px-4 py-3 animate-float hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-400 to-blue-400 flex items-center justify-center shrink-0">
                  <TrophyIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xs">週間ランキング</div>
                  <div className="text-gray-400 text-[10px]">毎週月曜に更新</div>
                </div>
              </div>
            </div>
            <div
              className="absolute -bottom-2 right-[2%] z-20 glass-card rounded-2xl px-4 py-3 hidden sm:block"
              style={{ animation: "float 5s ease-in-out infinite 1.5s" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-blue-400 to-blue-400 flex items-center justify-center shrink-0">
                  <FaceSmileIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xs">5種のリアクション</div>
                  <div className="text-gray-400 text-[10px]">読者からの反応が届く</div>
                </div>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/phone-mockup-aon.webp"
              alt="コマパラで「おくり狼のアオン」の4コマを読んでいる画面"
              className="w-full sm:w-[130%] sm:max-w-none sm:translate-x-[5%]"
              style={{
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
            { value: "500+", label: "投稿作品数", Icon: RectangleStackIcon, gradient: "from-blue-500 to-blue-500" },
            { value: "100+", label: "クリエイター", Icon: PencilSquareIcon, gradient: "from-blue-500 to-blue-500" },
            { value: "15", label: "ジャンル", Icon: TagIcon, gradient: "from-blue-500 to-blue-500" },
            { value: "¥0", label: "基本利用料", Icon: SparklesIcon, gradient: "from-blue-400 to-blue-500" },
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
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <item.Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-3">{item.problem}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-400 rounded-md border border-red-100 shrink-0">Before</span>
                    <span className="text-sm text-gray-400 line-through">{item.before}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 shrink-0">After</span>
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
      <section id="creators" className="py-24 px-6 bg-komapara-bg scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">FOR CREATORS</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">作家として、はじめる理由</h2>
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
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-50 to-blue-50 border border-blue-100/50 flex items-center justify-center shrink-0">
                  <feature.Icon className="w-6 h-6 text-blue-600" />
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

      {/* ===== ベータ版であることの明示 ===== */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 lp-animate">
            <span className="badge-glass inline-flex mb-5">BETA</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">正直にお伝えしておきます</h2>
            <p className="text-gray-500 mt-5 leading-relaxed">
              コマパラは立ち上げたばかりです。「いま読者が増えます」とは申し上げられません。<br className="hidden md:block" />
              そのうえで、4コマが埋もれない場所を本気で作っています。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {BETA_FACTS.map((f, i) => (
              <div key={f.title} className={`feature-card p-7 lp-animate lp-animate-delay-${Math.min(i + 1, 3)}`}>
                <p className="font-bold text-gray-900 mb-2">{f.title}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{f.text}</p>
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
                  <div className="hidden md:block absolute top-8 left-[62%] w-[76%] h-px bg-linear-to-r from-blue-200 to-blue-200" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-500 text-white font-black text-xl mb-5 shadow-lg shadow-blue-500/20">
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
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600"><CheckIcon className="w-3 h-3" /></span>
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
                    ? "ring-2 ring-blue-400/60 shadow-xl shadow-blue-500/10"
                    : "feature-card"
                } ${plan.upcoming ? "opacity-70" : ""}`}
              >
                {plan.featured && (
                  <div className="bg-gradient-main text-white text-xs font-bold text-center py-2 tracking-wider">
                    ✦ いま使えるプラン
                  </div>
                )}
                {plan.upcoming && (
                  <div className="bg-gray-100 text-gray-500 text-xs font-bold text-center py-2 tracking-wider">
                    準備中
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
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.featured ? "bg-blue-100" : "bg-gray-100"}`}>
                          <CheckIcon className={`w-2.5 h-2.5 ${plan.featured ? "text-blue-600" : "text-gray-500"}`} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.upcoming ? (
                    <span
                      aria-disabled="true"
                      className="block text-center py-3 rounded-xl text-sm font-bold border-2 border-gray-200 text-gray-400 cursor-not-allowed select-none"
                    >
                      {plan.cta}
                    </span>
                  ) : (
                    <Link
                      href="/login"
                      className={`block text-center py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                        plan.featured
                          ? "bg-gradient-main text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-px"
                          : "border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
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
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">Q</span>
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
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.35),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_70%,rgba(59,130,246,0.16),transparent)]" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto lp-animate">
          <span className="badge-dark inline-flex mb-8">✦ 作家募集中</span>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-[1.05] mb-6">
            あなたの作品を、<br />
            <span className="gradient-text">コマパラで。</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            登録30秒・完全無料。SNSからそのままインポート。<br className="sm:hidden" />
            今日から、新しい読者に届けよう。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-10 py-4 text-lg bg-gradient-main text-white font-bold rounded-2xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 text-center"
            >
              作家として参加 →
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
