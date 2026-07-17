import Link from "next/link";

export function Footer() {
  return (
    // ヘッダーと同じ単一アクセント青。サイトの上下端を同じ色で締める
    <footer className="bg-accent mt-12 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-base font-bold text-white">コマパラ</p>
          <nav className="flex flex-wrap justify-center gap-x-3 sm:gap-x-5 gap-y-2 text-xs text-white/75">
            <Link href="/about" className="hover:text-white transition-colors">コマパラについて</Link>
            <Link href="/terms" className="hover:text-white transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link>
            <Link href="/tokusho" className="hover:text-white transition-colors">特定商取引法</Link>
            <Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link>
          </nav>
          <p className="text-xs text-white/60">© 2026 コマパラ</p>
        </div>
      </div>
    </footer>
  );
}
