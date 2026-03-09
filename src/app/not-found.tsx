import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <p className="text-6xl font-black gradient-text mb-4">404</p>
      <h1 className="text-xl font-bold text-gray-800 mb-2">ページが見つかりません</h1>
      <p className="text-sm text-gray-500 mb-8">
        お探しのページは削除されたか、URLが変更された可能性があります。
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-main rounded-xl shadow-sm shadow-purple-500/20 hover:shadow-md hover:shadow-purple-500/30 transition-all"
      >
        トップへ戻る
      </Link>
    </div>
  );
}
