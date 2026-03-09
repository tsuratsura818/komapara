import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 mt-12 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold gradient-text">コマパラ</p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
            <Link href="/about" className="hover:text-gray-600 transition-colors">コマパラについて</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">プライバシーポリシー</Link>
            <Link href="/tokusho" className="hover:text-gray-600 transition-colors">特定商取引法</Link>
            <Link href="/contact" className="hover:text-gray-600 transition-colors">お問い合わせ</Link>
          </nav>
          <p className="text-xs text-gray-300">© 2026 コマパラ</p>
        </div>
      </div>
    </footer>
  );
}
