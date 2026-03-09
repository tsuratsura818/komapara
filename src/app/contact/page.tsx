import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";

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

      <ContactForm />

      <div className="mt-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
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
              <p className="mt-0.5 text-gray-500">作品ページの通報ボタン、またはこちらのフォームよりご連絡ください。</p>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex gap-4 text-xs text-gray-400">
        <Link href="/terms" className="hover:text-gray-600">利用規約</Link>
        <Link href="/privacy" className="hover:text-gray-600">プライバシーポリシー</Link>
        <Link href="/tokusho" className="hover:text-gray-600">特定商取引法</Link>
      </div>
    </div>
  );
}
