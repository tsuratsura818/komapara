import { LoginButtons } from "@/components/auth/LoginButtons";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-white">コマパラ</h1>
          </Link>
          <p className="mt-2 text-white/70 text-sm">
            4コマ漫画をもっと楽しく
          </p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-2xl shadow-blue-500/20">
          <h2 className="text-lg font-semibold text-komapara-text text-center mb-6">
            ログイン / 新規登録
          </h2>
          <LoginButtons />
          <p className="mt-4 text-xs text-komapara-muted text-center">
            ログインすると
            <Link href="/terms" className="gradient-text font-medium hover:underline">
              利用規約
            </Link>
            と
            <Link href="/privacy" className="gradient-text font-medium hover:underline">
              プライバシーポリシー
            </Link>
            に同意したとみなされます
          </p>
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            ログインせずに閲覧する
          </Link>
          <Link
            href="/about"
            className="text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            コマパラについて
          </Link>
        </div>
      </div>
    </div>
  );
}
