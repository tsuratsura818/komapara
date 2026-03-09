import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { OutreachManager } from "@/components/admin/OutreachManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "クリエイター招待管理" };

export default async function OutreachPage() {
  await requireAdmin();

  const items = await prisma.creatorOutreach.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const stats = {
    total: items.length,
    候補: items.filter((i) => i.status === "候補").length,
    いいね中: items.filter((i) => i.status === "いいね中").length,
    DM送信済: items.filter((i) => i.status === "DM送信済").length,
    返信あり: items.filter((i) => i.status === "返信あり").length,
    登録済み: items.filter((i) => i.status === "登録済み").length,
    見送り: items.filter((i) => i.status === "見送り").length,
  };

  return (
    <div>
      <h1 className="text-xl font-bold gradient-text mb-4">クリエイター招待管理</h1>

      {/* 統計サマリー */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-6">
        {Object.entries(stats).map(([label, count]) => (
          <div key={label} className="glass rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-komapara-text">{count}</p>
            <p className="text-[10px] text-komapara-muted">{label}</p>
          </div>
        ))}
      </div>

      <OutreachManager initialItems={items.map((i) => ({
        ...i,
        dmSentAt: i.dmSentAt?.toISOString() ?? null,
        repliedAt: i.repliedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      }))} />
    </div>
  );
}
