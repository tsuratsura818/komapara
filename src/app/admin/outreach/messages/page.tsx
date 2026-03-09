import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { generateDM } from "@/lib/dm-templates";
import type { Metadata } from "next";
import { DmMessageList } from "@/components/admin/DmMessageList";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "DM提案文一覧" };

export default async function DmMessagesPage() {
  await requireAdmin();

  const creators = await prisma.creatorOutreach.findMany({
    orderBy: [
      { followers: "asc" }, // フォロワー少ない（優先度A）を先に
      { genre: "asc" },
    ],
  });

  const items = creators.map((c) => ({
    id: c.id,
    xHandle: c.xHandle,
    name: c.name,
    genre: c.genre,
    followers: c.followers,
    status: c.status,
    note: c.note,
    dmText: generateDM({
      xHandle: c.xHandle,
      name: c.name,
      genre: c.genre,
      followers: c.followers,
      note: c.note,
    }),
  }));

  const priorityA = items.filter((i) => i.followers < 50000 && !["DM送信済", "登録済み", "見送り"].includes(i.status)).length;
  const priorityB = items.filter((i) => i.followers >= 50000 && i.followers < 100000 && !["DM送信済", "登録済み", "見送り"].includes(i.status)).length;
  const priorityC = items.filter((i) => i.followers >= 100000 && !["DM送信済", "登録済み", "見送り"].includes(i.status)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold gradient-text">DM提案文一覧</h1>
        <Link
          href="/admin/outreach"
          className="px-3 py-1.5 text-xs rounded-lg glass text-komapara-muted hover:text-komapara-text transition-colors"
        >
          ← 招待管理に戻る
        </Link>
      </div>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-xl p-4 text-center border-l-4 border-green-400">
          <p className="text-2xl font-bold text-green-600">{priorityA}</p>
          <p className="text-xs text-komapara-muted">優先度A（〜5万）</p>
          <p className="text-[10px] text-komapara-muted">DM反応率が高い</p>
        </div>
        <div className="glass rounded-xl p-4 text-center border-l-4 border-yellow-400">
          <p className="text-2xl font-bold text-yellow-600">{priorityB}</p>
          <p className="text-xs text-komapara-muted">優先度B（5〜10万）</p>
          <p className="text-[10px] text-komapara-muted">中規模</p>
        </div>
        <div className="glass rounded-xl p-4 text-center border-l-4 border-red-400">
          <p className="text-2xl font-bold text-red-500">{priorityC}</p>
          <p className="text-xs text-komapara-muted">優先度C（10万+）</p>
          <p className="text-[10px] text-komapara-muted">長期目標</p>
        </div>
      </div>

      <div className="glass rounded-xl p-3 mb-4 text-xs text-komapara-muted">
        <p>各クリエイターのジャンル・フォロワー規模に合わせた提案文が自動生成されています。</p>
        <p>クリックで展開 → 文面を確認・編集 → コピーしてXのDMに貼り付けてください。</p>
      </div>

      <DmMessageList items={items} />
    </div>
  );
}
