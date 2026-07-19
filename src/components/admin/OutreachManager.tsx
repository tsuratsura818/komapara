"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { generateDM } from "@/lib/dm-templates";

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
  登録済み: "bg-blue-100 text-blue-700",
  見送り: "bg-red-50 text-red-400",
};

export function OutreachManager({ initialItems }: { initialItems: OutreachItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dmCopiedId, setDmCopiedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

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
      // 一括更新は Promise.all で同時に走るため、items をそのまま参照すると
      // 各呼び出しが同じ古い配列を基準にして最後の1件しか残らない
      setItems((prev) => prev.map((i) => (i.id === id ? {
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
      // 一括更新は Promise.all で同時に走るため、items をそのまま参照すると
      // 各呼び出しが同じ古い配列を基準にして最後の1件しか残らない
      setItems((prev) => prev.map((i) => (i.id === id ? {
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
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  // DM送信ワンクリック: コピー → X DM画面を開く → ステータス更新
  const handleSendDM = async (item: OutreachItem) => {
    const dmText = generateDM({
      xHandle: item.xHandle,
      name: item.name,
      genre: item.genre,
      followers: item.followers,
      note: item.note,
    });
    await navigator.clipboard.writeText(dmText);
    setDmCopiedId(item.id);
    setTimeout(() => setDmCopiedId(null), 3000);

    // X DM画面を開く（プロフィールページ経由）
    window.open(`https://x.com/${item.xHandle}`, "_blank");

    // ステータスをDM送信済に更新
    if (item.status !== "DM送信済" && item.status !== "返信あり" && item.status !== "登録済み") {
      await handleStatusChange(item.id, "DM送信済");
    }
  };

  // 登録状況を同期
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/outreach/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`${data.checked}件チェック → ${data.updated}件を「登録済み」に更新`);
        if (data.updated > 0) {
          // リロードしてリスト更新
          window.location.reload();
        }
      }
    } catch {
      setSyncResult("同期に失敗しました");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  // 選択トグル
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((i) => i.id)));
    }
  };

  // 一括: Xプロフィールを開く（いいね用）
  const handleBatchOpenX = () => {
    const selected = filtered.filter((i) => selectedIds.has(i.id));
    selected.slice(0, 10).forEach((item) => {
      window.open(`https://x.com/${item.xHandle}`, "_blank");
    });
    if (selected.length > 10) {
      alert(`上限10件までブラウザで開きました（${selected.length}件中）。残りは次のバッチで開いてください。`);
    }
  };

  // 一括: ステータス変更
  const handleBatchStatusChange = async (newStatus: string) => {
    const selected = filtered.filter((i) => selectedIds.has(i.id));
    await Promise.all(
      selected.map((item) => handleStatusChange(item.id, newStatus))
    );
    setSelectedIds(new Set());
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
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
          title="登録済みユーザーとxHandleを突合"
        >
          {syncing ? "同期中..." : "登録同期"}
        </button>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-main rounded-xl"
        >
          + 追加
        </button>
      </div>

      {/* 同期結果 */}
      {syncResult && (
        <div className="glass rounded-xl p-3 mb-3 text-xs text-komapara-text bg-green-50/50 border border-green-200/50">
          {syncResult}
        </div>
      )}

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
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs text-komapara-muted mb-1">名前 *</label>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="表示名"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-xs text-komapara-muted mb-1">ジャンル *</label>
            <select
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-300"
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
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-komapara-muted mb-1">メモ</label>
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="作風や連絡先の情報など"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-300"
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

      {/* 一括アクションバー */}
      {selectedIds.size > 0 && (
        <div className="glass rounded-xl p-3 mb-3 flex flex-wrap items-center gap-2 sticky top-0 z-10 border border-blue-200/50">
          <span className="text-xs font-medium text-komapara-text">
            {selectedIds.size}件選択中
          </span>
          <button
            onClick={handleBatchOpenX}
            className="px-3 py-1.5 text-xs rounded-lg bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Xを開く（いいね用）
          </button>
          <button
            onClick={() => handleBatchStatusChange("いいね中")}
            className="px-3 py-1.5 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            → いいね中
          </button>
          <button
            onClick={() => handleBatchStatusChange("DM送信済")}
            className="px-3 py-1.5 text-xs rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
          >
            → DM送信済
          </button>
          <button
            onClick={() => handleBatchStatusChange("見送り")}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-400 text-white hover:bg-red-500 transition-colors"
          >
            → 見送り
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto px-3 py-1.5 text-xs text-komapara-muted hover:text-komapara-text"
          >
            選択解除
          </button>
        </div>
      )}

      {/* リスト */}
      <div className="space-y-2">
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 px-1 mb-1">
            <input
              type="checkbox"
              checked={selectedIds.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[10px] text-komapara-muted">すべて選択</span>
          </div>
        )}
        {filtered.map((item) => (
          <div key={item.id} className={cn(
            "glass rounded-xl p-4 transition-all",
            selectedIds.has(item.id) && "ring-2 ring-blue-300"
          )}>
            <div className="flex flex-wrap items-start gap-3">
              {/* チェックボックス */}
              <input
                type="checkbox"
                checked={selectedIds.has(item.id)}
                onChange={() => toggleSelect(item.id)}
                className="w-4 h-4 mt-1 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500 shrink-0"
              />
              {/* 左: プロフィール */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`https://x.com/${item.xHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-komapara-text hover:text-blue-600 transition-colors"
                  >
                    @{item.xHandle}
                  </a>
                  <span className="text-sm text-komapara-muted">{item.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60">
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
                    className="text-xs text-komapara-muted bg-transparent border-none focus:outline-hidden focus:ring-0 w-full"
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
              <div className="flex items-center gap-2 shrink-0">
                {editingId === item.id ? (
                  <div className="flex flex-wrap gap-1">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(item.id, s)}
                        className={cn(
                          "px-2 py-1 text-[10px] rounded-full font-medium transition-all",
                          item.status === s
                            ? "ring-2 ring-blue-400 " + STATUS_COLORS[s]
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
                    {/* DM送信ボタン（候補・いいね中のみ表示） */}
                    {(item.status === "候補" || item.status === "いいね中") && (
                      <button
                        onClick={() => handleSendDM(item)}
                        className={cn(
                          "px-3 py-1 text-xs rounded-lg font-medium transition-all",
                          dmCopiedId === item.id
                            ? "bg-green-500 text-white"
                            : "bg-linear-to-r from-blue-500 to-blue-500 text-white hover:opacity-90"
                        )}
                        title="DM文をコピーしてXプロフィールを開く"
                      >
                        {dmCopiedId === item.id ? "コピー済!" : "DM送信"}
                      </button>
                    )}
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
