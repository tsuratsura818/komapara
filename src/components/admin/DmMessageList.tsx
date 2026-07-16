"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CreatorMessage = {
  id: string;
  xHandle: string;
  name: string;
  genre: string;
  followers: number;
  status: string;
  note: string | null;
  dmText: string;
};

const GENRES = ["日常", "育児", "猫", "ギャグ", "エッセイ", "恋愛", "仕事", "感動", "その他"];

const STATUS_COLORS: Record<string, string> = {
  候補: "bg-gray-100 text-gray-600",
  いいね中: "bg-blue-100 text-blue-700",
  DM送信済: "bg-yellow-100 text-yellow-700",
  返信あり: "bg-green-100 text-green-700",
  登録済み: "bg-blue-100 text-blue-700",
  見送り: "bg-red-50 text-red-400",
};

function FollowerBadge({ count }: { count: number }) {
  if (count >= 100000) return <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-red-50 text-red-500 font-medium">C ({(count / 10000).toFixed(1)}万)</span>;
  if (count >= 50000) return <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-yellow-50 text-yellow-600 font-medium">B ({(count / 10000).toFixed(1)}万)</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-50 text-green-600 font-medium">A ({count.toLocaleString()})</span>;
}

export function DmMessageList({ items }: { items: CreatorMessage[] }) {
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});

  const filtered = items.filter((item) => {
    // ステータスフィルタ: DM送信済・登録済み・見送りは除外（デフォルト）
    if (item.status === "DM送信済" || item.status === "登録済み" || item.status === "見送り") return false;
    if (filterGenre && item.genre !== filterGenre) return false;
    if (filterPriority) {
      if (filterPriority === "A" && item.followers >= 50000) return false;
      if (filterPriority === "B" && (item.followers < 50000 || item.followers >= 100000)) return false;
      if (filterPriority === "C" && item.followers < 100000) return false;
    }
    return true;
  });

  const handleCopy = async (id: string, text: string) => {
    const finalText = editedTexts[id] || text;
    await navigator.clipboard.writeText(finalText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenX = (handle: string) => {
    window.open(`https://x.com/messages/compose?recipient_id=&text=`, "_blank");
    // Xの仕様上、recipient_idが必要なためプロフィールページに遷移
    window.open(`https://x.com/${handle}`, "_blank");
  };

  const priorityCounts = {
    A: items.filter((i) => i.followers < 50000 && !["DM送信済", "登録済み", "見送り"].includes(i.status)).length,
    B: items.filter((i) => i.followers >= 50000 && i.followers < 100000 && !["DM送信済", "登録済み", "見送り"].includes(i.status)).length,
    C: items.filter((i) => i.followers >= 100000 && !["DM送信済", "登録済み", "見送り"].includes(i.status)).length,
  };

  return (
    <div>
      {/* フィルター */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-komapara-muted mr-1">優先度:</span>
        {(["A", "B", "C"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriority(filterPriority === p ? null : p)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full transition-all",
              filterPriority === p ? "bg-gradient-main text-white" : "glass text-komapara-muted"
            )}
          >
            {p} ({priorityCounts[p]})
          </button>
        ))}
        <select
          value={filterGenre || ""}
          onChange={(e) => setFilterGenre(e.target.value || null)}
          className="ml-auto px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white"
        >
          <option value="">全ジャンル</option>
          {GENRES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* リスト */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          const currentText = editedTexts[item.id] || item.dmText;

          return (
            <div key={item.id} className="glass rounded-xl overflow-hidden">
              {/* ヘッダー行 */}
              <div
                className="p-4 cursor-pointer hover:bg-white/40 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-komapara-text">
                    {item.name}
                  </span>
                  <a
                    href={`https://x.com/${item.xHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    @{item.xHandle}
                  </a>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60">
                    {item.genre}
                  </span>
                  <FollowerBadge count={item.followers} />
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", STATUS_COLORS[item.status])}>
                    {item.status}
                  </span>
                  {item.note && (
                    <span className="text-[10px] text-komapara-muted truncate max-w-[200px]">
                      {item.note}
                    </span>
                  )}
                  <span className="ml-auto text-komapara-muted text-xs">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* 展開: DM文 */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-white/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-komapara-text">DM提案文</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenX(item.xHandle)}
                        className="px-3 py-1 text-xs rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
                      >
                        Xプロフィールを開く
                      </button>
                      <button
                        onClick={() => handleCopy(item.id, item.dmText)}
                        className={cn(
                          "px-3 py-1 text-xs rounded-lg transition-all",
                          copiedId === item.id
                            ? "bg-green-500 text-white"
                            : "bg-gradient-main text-white hover:opacity-90"
                        )}
                      >
                        {copiedId === item.id ? "コピーしました!" : "コピー"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={currentText}
                    onChange={(e) => setEditedTexts({ ...editedTexts, [item.id]: e.target.value })}
                    className="w-full min-h-[300px] p-3 text-sm leading-relaxed rounded-lg border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-300 resize-y font-sans"
                  />
                  <p className="text-[10px] text-komapara-muted mt-1">
                    ※ 編集した内容はこのページ内でのみ保持されます。コピーボタンで編集後の文面がコピーされます。
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-komapara-muted glass rounded-xl">
            <p>該当するクリエイターがいません</p>
          </div>
        )}
      </div>

      <p className="text-xs text-komapara-muted mt-4 text-right">
        {filtered.length} 件表示（DM送信済・登録済み・見送りは除外）
      </p>
    </div>
  );
}
