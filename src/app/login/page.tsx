import { LoginButtons } from "@/components/auth/LoginButtons";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-komapara-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary-500">コマパラ</h1>
          </Link>
          <p className="mt-2 text-komapara-muted text-sm">
            4コマ漫画をもっと楽しく
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-komapara-border p-6">
          <h2 className="text-lg font-semibold text-komapara-text text-center mb-6">
            ログイン / 新規登録
          </h2>
          <LoginButtons />
          <p className="mt-4 text-xs text-komapara-muted text-center">
            ログインすると
            <a href="#" className="text-primary-500 hover:underline">
              利用規約
            </a>
            と
            <a href="#" className="text-primary-500 hover:underline">
              プライバシーポリシー
            </a>
            に同意したとみなされます
          </p>
        </div>

        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-komapara-muted hover:text-komapara-text"
          >
            ログインせずに閲覧する
          </Link>
        </p>
      </div>
    </div>
  );
}
