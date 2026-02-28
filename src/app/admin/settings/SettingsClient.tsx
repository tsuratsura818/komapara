"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Tag {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  _count: { works: number };
}

const FEATURE_FLAGS = [
  { key: "registration_enabled", label: "新規登録", description: "ユーザーの新規登録を許可" },
  { key: "comments_enabled", label: "コメント機能", description: "作品へのコメント投稿を許可" },
  { key: "x_auto_post_enabled", label: "X自動投稿", description: "作品投稿時のX自動シェア" },
  { key: "tips_enabled", label: "投げ銭機能", description: "ユーザーによる投げ銭を許可（手数料10%）" },
  { key: "subscriptions_enabled", label: "サブスク機能", description: "クリエイターへの月額サブスクリプションを許可（手数料15%）" },
];

export function SettingsClient({
  initialSettings,
  initialTags,
}: {
  initialSettings: Record<string, string>;
  initialTags: Tag[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [tags, setTags] = useState(initialTags);
  const [loading, setLoading] = useState<string | null>(null);
  const [newTag, setNewTag] = useState({ name: "", slug: "", emoji: "" });
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const router = useRouter();

  async function toggleSetting(key: string) {
    const newValue = settings[key] === "true" ? "false" : "true";
    setLoading(key);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });
      if (res.ok) {
        setSettings((prev) => ({ ...prev, [key]: newValue }));
      } else {
        const data = await res.json();
        alert(data.error || "エラーが発生しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  async function createTag() {
    if (!newTag.name || !newTag.slug) {
      alert("名前とスラッグは必須です");
      return;
    }
    setLoading("create-tag");
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTag),
      });
      if (res.ok) {
        setNewTag({ name: "", slug: "", emoji: "" });
        router.refresh();
        const data = await res.json();
        setTags((prev) => [...prev, { ...data, _count: { works: 0 } }]);
      } else {
        const data = await res.json();
        alert(data.error || "エラーが発生しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  async function updateTag() {
    if (!editingTag) return;
    setLoading(`edit-${editingTag.id}`);
    try {
      const res = await fetch(`/api/admin/tags/${editingTag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingTag.name,
          slug: editingTag.slug,
          emoji: editingTag.emoji,
        }),
      });
      if (res.ok) {
        setTags((prev) =>
          prev.map((t) => (t.id === editingTag.id ? { ...editingTag } : t))
        );
        setEditingTag(null);
      } else {
        const data = await res.json();
        alert(data.error || "エラーが発生しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  async function deleteTag(id: string) {
    if (!confirm("このタグを削除しますか？")) return;
    setLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "エラーが発生しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  async function triggerRanking() {
    setLoading("ranking");
    try {
      const res = await fetch("/api/admin/actions/ranking", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        alert(data.error || "エラーが発生しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold gradient-text mb-6">サイト設定</h1>

      {/* 機能フラグ */}
      <div className="glass rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold gradient-text mb-4">機能フラグ</h2>
        <div className="space-y-3">
          {FEATURE_FLAGS.map((flag) => (
            <div
              key={flag.key}
              className="flex items-center justify-between py-2"
            >
              <div>
                <p className="text-sm font-medium">{flag.label}</p>
                <p className="text-xs text-komapara-muted">{flag.description}</p>
              </div>
              <button
                onClick={() => toggleSetting(flag.key)}
                disabled={loading === flag.key}
                className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${
                  settings[flag.key] === "true"
                    ? "bg-gradient-main"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings[flag.key] === "true"
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* タグ管理 */}
      <div className="glass rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold gradient-text mb-4">
          タグ / ジャンル管理
        </h2>

        {/* 新規作成フォーム */}
        <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-komapara-border">
          <input
            type="text"
            placeholder="絵文字"
            value={newTag.emoji}
            onChange={(e) => setNewTag((p) => ({ ...p, emoji: e.target.value }))}
            className="w-16 px-2 py-1.5 text-sm rounded-lg border border-komapara-border focus:outline-none focus:ring-2 focus:ring-gradient-purple/30"
          />
          <input
            type="text"
            placeholder="名前"
            value={newTag.name}
            onChange={(e) => setNewTag((p) => ({ ...p, name: e.target.value }))}
            className="flex-1 min-w-[100px] px-2 py-1.5 text-sm rounded-lg border border-komapara-border focus:outline-none focus:ring-2 focus:ring-gradient-purple/30"
          />
          <input
            type="text"
            placeholder="スラッグ (英数字)"
            value={newTag.slug}
            onChange={(e) => setNewTag((p) => ({ ...p, slug: e.target.value }))}
            className="flex-1 min-w-[100px] px-2 py-1.5 text-sm rounded-lg border border-komapara-border focus:outline-none focus:ring-2 focus:ring-gradient-purple/30"
          />
          <button
            onClick={createTag}
            disabled={loading === "create-tag"}
            className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-main rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            追加
          </button>
        </div>

        {/* タグ一覧 */}
        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 py-2 border-b border-komapara-border/30 last:border-b-0"
            >
              {editingTag?.id === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editingTag.emoji}
                    onChange={(e) =>
                      setEditingTag((p) =>
                        p ? { ...p, emoji: e.target.value } : null
                      )
                    }
                    className="w-12 px-1 py-1 text-sm rounded border border-komapara-border"
                  />
                  <input
                    type="text"
                    value={editingTag.name}
                    onChange={(e) =>
                      setEditingTag((p) =>
                        p ? { ...p, name: e.target.value } : null
                      )
                    }
                    className="flex-1 px-2 py-1 text-sm rounded border border-komapara-border"
                  />
                  <input
                    type="text"
                    value={editingTag.slug}
                    onChange={(e) =>
                      setEditingTag((p) =>
                        p ? { ...p, slug: e.target.value } : null
                      )
                    }
                    className="flex-1 px-2 py-1 text-sm rounded border border-komapara-border"
                  />
                  <button
                    onClick={updateTag}
                    disabled={loading === `edit-${tag.id}`}
                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingTag(null)}
                    className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <span className="w-8 text-center">{tag.emoji}</span>
                  <span className="flex-1 text-sm font-medium">{tag.name}</span>
                  <span className="text-xs text-komapara-muted">{tag.slug}</span>
                  <span className="text-xs text-komapara-muted">
                    {tag._count.works}件
                  </span>
                  <button
                    onClick={() => setEditingTag(tag)}
                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    disabled={
                      loading === `delete-${tag.id}` || tag._count.works > 0
                    }
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                    title={
                      tag._count.works > 0
                        ? "作品が紐付いているため削除不可"
                        : undefined
                    }
                  >
                    削除
                  </button>
                </>
              )}
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-sm text-komapara-muted text-center py-4">
              タグがありません
            </p>
          )}
        </div>
      </div>

      {/* アクション */}
      <div className="glass rounded-xl p-4">
        <h2 className="text-sm font-semibold gradient-text mb-4">アクション</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">ランキング再集計</p>
            <p className="text-xs text-komapara-muted">
              週間ランキングを手動で再計算します
            </p>
          </div>
          <button
            onClick={triggerRanking}
            disabled={loading === "ranking"}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {loading === "ranking" ? "集計中..." : "実行"}
          </button>
        </div>
      </div>
    </div>
  );
}
