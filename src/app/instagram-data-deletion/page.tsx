import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Instagramデータ削除の確認" };

type Props = { searchParams: Promise<{ id?: string }> };

/**
 * Metaのデータ削除リクエストの確認ページ（App Review必須）。
 * 削除リクエストの受付番号から、現在の状態を利用者自身が確認できる。
 */
export default async function InstagramDataDeletionPage(props: Props) {
  const { id } = await props.searchParams;

  const stillLinked = id
    ? (await prisma.instagramAccount.count({ where: { igUserId: id } })) > 0
    : false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-komapara-text mb-4">
        Instagramデータ削除の確認
      </h1>

      {!id ? (
        <p className="text-sm text-komapara-muted">
          確認コードが指定されていません。Instagramのアプリ設定から削除リクエストを行うと、
          確認用のリンクが発行されます。
        </p>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-xl border border-komapara-border">
            <p className="text-xs text-komapara-muted">確認コード</p>
            <p className="text-sm font-mono text-komapara-text break-all">{id}</p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-komapara-border">
            <p className="text-xs text-komapara-muted">状態</p>
            <p className="text-sm font-semibold text-komapara-text">
              {stillLinked ? "処理中" : "削除済み"}
            </p>
          </div>

          <div className="text-sm leading-relaxed text-komapara-text/80 space-y-2">
            <p>
              コマパラがInstagramから受け取ったデータ（アカウント連携情報・アクセストークン）を削除しました。
              以後、コマパラからあなたのInstagramへアクセスすることはありません。
            </p>
            <p>
              なお、あなたがコマパラに投稿した作品は、あなた自身の著作物としてコマパラ上に残ります。
              作品やアカウントの削除をご希望の場合は、
              <a href="/contact" className="text-accent underline">
                お問い合わせ
              </a>
              からご連絡ください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
