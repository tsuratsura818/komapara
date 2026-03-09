"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type OutreachItem = {
  id: string;
  xHandle: string;
  name: string;
  genre: string;
  followers: number;
  status: string;
  note: string | null;
  dmSentAt: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUSES = ["候補", "いいね中", "DM送信済", "返信あり", "登録済み", "見送り"];
const GENRES = ["日常", "育児", "猫", "ギャグ", "エッセイ", "恋愛", "仕事", "感動", "その他"];

const STATUS_COLORS: Record<string, string> = {
  候補: "bg-gray-100 text-gray-600",
  いいね中: "bg-blue-100 text-blue-700",
  DM送信済: "bg-yellow-100 text-yellow-700",
  返信あり: "bg-green-100 text-green-700",
  登録済み: "bg-purple-100 text-purple-700",
  見送り: "bg-red-50 text-red-400",
};

export function OutreachManager({ initialItems }: { initialItems: OutreachItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 追加フォーム
  const [newHandle, setNewHandle] = useState("");
  const [newName, setNewName] = useState("");
  const [newGenre, setNewGenre] = useState("日常");
  const [newFollowers, setNewFollowers] = useState("");
  const [newNote, setNewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = items.filter((item) => {
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterGenre && item.genre !== filterGenre) return false;
    return true;
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xHandle: newHandle,
          name: newName,
          genre: newGenre,
          followers: parseInt(newFollowers) || 0,
          note: newNote || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "追加に失敗しました");
        return;
      }
      const item = await res.json();
      setItems([item, ...items]);
      setNewHandle("");
      setNewName("");
      setNewGenre("日常");
      setNewFollowers("");
      setNewNote("");
      setShowAddForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const data: Record<string, unknown> = { status: newStatus };
    if (newStatus === "DM送信済") data.dmSentAt = new Date().toISOString();
    if (newStatus === "返信あり") data.repliedAt = new Date().toISOString();

    const res = await fetch(`/api/admin/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(items.map((i) => (i.id === id ? {
        ...updated,
        dmSentAt: updated.dmSentAt ?? null,
        repliedAt: updated.repliedAt ?? null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      } : i)));
    }
    setEditingId(null);
  };

  const handleNoteUpdate = async (id: string, note: string) => {
    const res = await fetch(`/api/admin/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(items.map((i) => (i.id === id ? {
        ...updated,
        dmSentAt: updated.dmSentAt ?? null,
        repliedAt: updated.repliedAt ?? null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      } : i)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    const res = await fetch(`/api/admin/outreach/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(items.filter((i) => i.id !== id));
    }
  };

  return (
    <div>
      {/* フィルター + 追加ボタン */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setFilterStatus(null)}
          className={cn(
            "px-3 py-1.5 text-xs rounded-full transition-all",
            !filterStatus ? "bg-gradient-main text-white" : "glass text-komapara-muted"
          )}
        >
          すべて
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? null : s)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full transition-all",
              filterStatus === s ? "bg-gradient-main text-white" : "glass text-komapara-muted"
            )}
          >
            {s}
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
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-main rounded-xl"
        >
          + 追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="glass rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-komapara-muted mb-1">Xハンドル *</label>
            <input
              required
              value={newHandle}
              onChange={(e) => setNewHandle(e.target.value)}
              placeholder="@username"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="block text-xs text-komapara-muted mb-1">名前 *</label>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="表示名"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="block text-xs text-komapara-muted mb-1">ジャンル *</label>
            <select
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-komapara-muted mb-1">フォロワー数</label>
            <input
              type="number"
              value={newFollowers}
              onChange={(e) => setNewFollowers(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-komapara-muted mb-1">メモ</label>
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="作風や連絡先の情報など"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-bold text-white bg-gradient-main rounded-xl disabled:opacity-50"
            >
              {submitting ? "追加中..." : "追加"}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-sm text-komapara-muted hover:text-komapara-text"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* リスト */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div key={item.id} className="glass rounded-xl p-4">
            <div className="flex flex-wrap items-start gap-3">
              {/* 左: プロフィール */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`https://x.com/${item.xHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-komapara-text hover:text-purple-600 transition-colors"
                  >
                    @{item.xHandle}
                  </a>
                  <span className="text-sm text-komapara-muted">{item.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100/60">
                    {item.genre}
                  </span>
                  {item.followers > 0 && (
                    <span className="text-[10px] text-komapara-muted">
                      {item.followers.toLocaleString()} フォロワー
                    </span>
                  )}
                </div>

                {/* メモ */}
                <div className="mt-1">
                  <input
                    defaultValue={item.note || ""}
                    placeholder="メモを入力..."
                    className="text-xs text-komapara-muted bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                    onBlur={(e) => {
                      if (e.target.value !== (item.note || "")) {
                        handleNoteUpdate(item.id, e.target.value);
                      }
                    }}
                  />
                </div>

                {/* 日時情報 */}
                <div className="flex gap-3 mt-1 text-[10px] text-komapara-muted">
                  {item.dmSentAt && (
                    <span>DM送信: {new Date(item.dmSentAt).toLocaleDateString("ja-JP")}</span>
                  )}
                  {item.repliedAt && (
                    <span>返信: {new Date(item.repliedAt).toLocaleDateString("ja-JP")}</span>
                  )}
                </div>
              </div>

              {/* 右: ステータス + アクション */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {editingId === item.id ? (
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(item.id, s)}
                        className={cn(
                          "px-2 py-1 text-[10px] rounded-full font-medium transition-all",
                          item.status === s
                            ? "ring-2 ring-purple-400 " + STATUS_COLORS[s]
                            : STATUS_COLORS[s] + " opacity-60 hover:opacity-100"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1 text-[10px] text-komapara-muted"
                    >
                      x
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingId(item.id)}
                      className={cn(
                        "px-3 py-1 text-xs rounded-full font-medium",
                        STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"
                      )}
                    >
                      {item.status}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                      title="削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-komapara-muted glass rounded-xl">
            <p>まだクリエイターが登録されていません</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-3 px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-full"
            >
              最初のクリエイターを追加
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-komapara-muted mt-4 text-right">
        {filtered.length} / {items.length} 件表示
      </p>
    </div>
  );
}
