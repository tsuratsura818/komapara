import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "お問い合わせ",
};

export default function ContactPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">お問い合わせ</h1>
      <p className="text-sm text-gray-500 mb-8">
        ご不明な点・ご要望・不具合のご報告はこちらからお気軽にご連絡ください。
      </p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">メールでのお問い合わせ</p>
          <a
            href="mailto:【メールアドレスを記入】"
            className="text-sm text-violet-600 hover:underline break-all"
          >
            【メールアドレスを記入】
          </a>
        </div>

        <hr className="border-gray-100" />

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">よくあるご質問</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <span className="font-medium">Q. 投稿した作品を削除したい</span>
              <p className="mt-0.5 text-gray-500">ダッシュボードの作品一覧から鉛筆アイコンをクリックし、「この作品を削除する」ボタンをご利用ください。</p>
            </li>
            <li className="pt-2">
              <span className="font-medium">Q. アカウントを削除したい</span>
              <p className="mt-0.5 text-gray-500">設定ページよりアカウント削除が可能です。削除後のデータは復元できませんのでご注意ください。</p>
            </li>
            <li className="pt-2">
              <span className="font-medium">Q. 不適切なコンテンツを見つけた</span>
              <p className="mt-0.5 text-gray-500">上記メールアドレスまでご報告ください。確認の上、対応いたします。</p>
            </li>
          </ul>
        </div>

        <hr className="border-gray-100" />

        <p className="text-xs text-gray-400">
          返信までに数日かかる場合があります。あらかじめご了承ください。
        </p>
      </div>

      <div className="mt-6 flex gap-4 text-xs text-gray-400">
        <Link href="/terms" className="hover:text-gray-600">利用規約</Link>
        <Link href="/privacy" className="hover:text-gray-600">プライバシーポリシー</Link>
        <Link href="/tokusho" className="hover:text-gray-600">特定商取引法</Link>
      </div>
    </div>
  );
}
