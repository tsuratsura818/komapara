import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
};

const TOKUSHO_KEYS = [
  "tokusho_vendor",
  "tokusho_representative",
  "tokusho_address",
  "tokusho_phone",
  "tokusho_email",
] as const;

function buildRows(tokusho: Record<string, string>) {
  return [
    { label: "販売業者", value: tokusho.tokusho_vendor || "未設定" },
    { label: "代表者名", value: tokusho.tokusho_representative || "未設定" },
    { label: "所在地", value: tokusho.tokusho_address || "未設定" },
    {
      label: "電話番号",
      value: tokusho.tokusho_phone
        ? `${tokusho.tokusho_phone}（お問い合わせはメールにてお願いします）`
        : "未設定",
    },
    { label: "メールアドレス", value: tokusho.tokusho_email || "未設定" },
    { label: "サービス名", value: "コマパラ" },
    { label: "サービスURL", value: "https://komapara.com" },
    {
      label: "販売価格",
      value:
        "プレミアムプラン：月額300円（税込）\n※各プランの詳細はサービス内の料金ページをご参照ください",
    },
    {
      label: "支払い方法",
      value: "クレジットカード（Visa・Mastercard・American Express・JCB）",
    },
    {
      label: "支払い時期",
      value:
        "月額プランの場合、申込時に初回課金し、以降は毎月同日に自動更新",
    },
    {
      label: "サービス提供時期",
      value: "決済完了後、即時ご利用いただけます",
    },
    {
      label: "返品・キャンセル",
      value:
        "デジタルコンテンツの性質上、決済後の返金・キャンセルはお受けできません。\nサブスクリプションは次回更新日までいつでも解約できます。解約後は期間終了まで引き続きご利用いただけます。",
    },
    {
      label: "動作環境",
      value:
        "最新バージョンのChrome・Firefox・Safari・Edge（スマートフォン・PC対応）",
    },
  ];
}

export default async function TokushoPage() {
  const dbSettings = await prisma.siteSetting
    .findMany({
      where: { key: { in: [...TOKUSHO_KEYS] } },
    })
    .catch(() => []);

  const tokusho: Record<string, string> = {};
  for (const s of dbSettings) {
    tokusho[s.key] = s.value;
  }

  const rows = buildRows(tokusho);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        特定商取引法に基づく表記
      </h1>
      <p className="text-sm text-gray-400 mb-8">最終更新日：2026年3月9日</p>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex flex-col sm:flex-row ${
              i % 2 === 0 ? "bg-white" : "bg-gray-50"
            }`}
          >
            <div className="sm:w-44 shrink-0 px-4 py-3 text-sm font-medium text-gray-700 border-b sm:border-b-0 sm:border-r border-gray-200">
              {row.label}
            </div>
            <div className="px-4 py-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line border-b border-gray-200 last:border-b-0">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
