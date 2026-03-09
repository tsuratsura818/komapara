import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

const SECTIONS = [
  {
    title: "1. 収集する情報",
    content: `当サービスは以下の情報を収集します。\n\n【アカウント情報】\n・メールアドレス、ユーザー名、プロフィール画像（Google/GitHubアカウント連携時）\n\n【利用情報】\n・投稿した作品・コメント・いいね等のコンテンツ\n・閲覧履歴・フォロー関係\n・プッシュ通知の購読情報\n\n【技術情報】\n・IPアドレス、ブラウザ種別、アクセス日時`,
  },
  {
    title: "2. 情報の利用目的",
    content: `収集した情報は以下の目的で利用します。\n・サービスの提供・改善\n・ユーザー認証・アカウント管理\n・プッシュ通知の送信\n・不正利用の検知・防止\n・統計データの分析（個人を特定しない形で）`,
  },
  {
    title: "3. 第三者への提供",
    content: `当サービスは、以下の場合を除き、個人情報を第三者に提供しません。\n・ユーザーの同意がある場合\n・法令に基づく開示要請がある場合\n・サービス運営に必要な業務委託先（インフラ事業者等）`,
  },
  {
    title: "4. 利用する外部サービス",
    content: `当サービスは以下の外部サービスを利用しています。\n\n・Vercel（ホスティング・画像ストレージ）\n　プライバシーポリシー: https://vercel.com/legal/privacy-policy\n\n・Supabase（データベース）\n　プライバシーポリシー: https://supabase.com/privacy\n\n・Google / GitHub OAuth（ログイン認証）\n　各社のプライバシーポリシーに準拠します`,
  },
  {
    title: "5. Cookieの使用",
    content: `当サービスはセッション管理のためにCookieを使用しています。ブラウザの設定でCookieを無効にすることができますが、一部機能が利用できなくなる場合があります。`,
  },
  {
    title: "6. 情報の保管・セキュリティ",
    content: `収集した情報はSSL/TLS暗号化通信で送受信し、適切なセキュリティ対策を施したサーバーで管理します。ただし、インターネット上の完全な安全性を保証するものではありません。`,
  },
  {
    title: "7. 個人情報の開示・訂正・削除",
    content: `ユーザーは自身の個人情報について、開示・訂正・削除を請求できます。アカウント設定ページから変更・削除が可能です。それ以外のご要望はお問い合わせページよりご連絡ください。`,
  },
  {
    title: "8. 未成年者の利用",
    content: `13歳未満の方は当サービスをご利用いただけません。13歳以上18歳未満の方は保護者の同意を得た上でご利用ください。`,
  },
  {
    title: "9. プライバシーポリシーの変更",
    content: `本ポリシーは必要に応じて変更することがあります。重要な変更がある場合はサービス内でお知らせします。`,
  },
  {
    title: "10. お問い合わせ",
    content: `個人情報に関するお問い合わせは、お問い合わせページよりご連絡ください。`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-gray-400 mb-8">最終更新日：2026年3月9日</p>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-bold text-gray-800 mb-2">{section.title}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
