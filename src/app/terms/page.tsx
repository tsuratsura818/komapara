import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
};

const SECTIONS = [
  {
    title: "第1条（適用）",
    content: `本規約は、コマパラ（以下「当サービス」）の利用に関する条件を、利用者と運営者との間で定めるものです。利用者は本規約に同意した上で当サービスをご利用ください。`,
  },
  {
    title: "第2条（利用登録）",
    content: `当サービスへの登録は、登録希望者が本規約に同意の上、所定の方法で申請し、運営者がこれを承認することで完了します。未成年者は保護者の同意を得た上でご利用ください。`,
  },
  {
    title: "第3条（投稿コンテンツ）",
    content: `利用者は、自らが著作権その他の権利を有するコンテンツのみを投稿できます。投稿されたコンテンツの著作権は投稿者に帰属しますが、当サービスはサービス運営に必要な範囲でコンテンツを利用できるものとします。`,
  },
  {
    title: "第4条（禁止事項）",
    content: `利用者は以下の行為を行ってはなりません。\n・他者の著作権・知的財産権を侵害する行為\n・他者を誹謗中傷する行為\n・わいせつ・暴力的なコンテンツの投稿\n・スパム・過度な商業広告の投稿\n・当サービスの運営を妨害する行為\n・法令に違反する行為\n・その他、運営者が不適切と判断する行為`,
  },
  {
    title: "第5条（コンテンツの削除）",
    content: `運営者は、投稿されたコンテンツが本規約に違反すると判断した場合、事前通知なく当該コンテンツを削除できます。また、利用者は自身の投稿コンテンツをいつでも削除できます。`,
  },
  {
    title: "第6条（有料サービス）",
    content: `当サービスは一部有料プランを提供しています。有料プランの料金・内容は別途定める通りです。支払いが確認できない場合、有料機能の利用を停止することがあります。`,
  },
  {
    title: "第7条（免責事項）",
    content: `当サービスは、利用者が投稿したコンテンツについて一切の責任を負いません。また、サービスの中断・停止・終了により生じた損害についても責任を負いかねます。`,
  },
  {
    title: "第8条（規約の変更）",
    content: `運営者は必要に応じて本規約を変更できます。変更後も当サービスを利用した場合、変更後の規約に同意したものとみなします。`,
  },
  {
    title: "第9条（準拠法・管轄）",
    content: `本規約は日本法に準拠します。当サービスに関する紛争は、運営者所在地を管轄する裁判所を専属的合意管轄とします。`,
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">利用規約</h1>
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
