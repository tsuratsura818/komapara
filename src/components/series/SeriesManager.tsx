"use client";

import { useState } from "react";
import Link from "next/link";

type Work = {
  id: string;
  title: string;
  panels: string[];
  seriesOrder: number | null;
};

type Series = {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  works: Work[];
};

export function SeriesManager({
  initialSeries,
  userWorks,
}: {
  initialSeries: Series[];
  userWorks: { id: string; title: string; panels: string[]; seriesId: string | null }[];
}) {
  const [seriesList, setSeriesList] = useState(initialSeries);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!newTitle.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setError("");
    setLoading("create");
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "作成に失敗しました");
        return;
      }
      const data = await res.json();
      setSeriesList((prev) => [{ ...data, works: [] }, ...prev]);
      setNewTitle("");
      setNewDesc("");
      setCreating(false);
    } catch {
      setError("作成に失敗しました");
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このシリーズを削除しますか？（作品は削除されません）")) return;
    setLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/series/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSeriesList((prev) => prev.filter((s) => s.id !== id));
      }
    } finally {
      setLoading(null);
    }
  };

  const handleToggleComplete = async (id: string, current: boolean) => {
    setLoading(`toggle-${id}`);
    try {
      const res = await fetch(`/api/series/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !current }),
      });
      if (res.ok) {
        setSeriesList((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, isCompleted: !current } : s
          )
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const handleAddWork = async (seriesId: string, workId: string) => {
    setLoading(`add-${workId}`);
    try {
      const res = await fetch(`/api/series/${seriesId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addWorkId: workId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSeriesList((prev) =>
          prev.map((s) => (s.id === seriesId ? { ...s, works: data.works } : s))
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const handleRemoveWork = async (seriesId: string, workId: string) => {
    setLoading(`remove-${workId}`);
    try {
      const res = await fetch(`/api/series/${seriesId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeWorkId: workId }),
      });
      if (res.ok) {
        setSeriesList((prev) =>
          prev.map((s) =>
            s.id === seriesId
              ? { ...s, works: s.works.filter((w) => w.id !== workId) }
              : s
          )
        );
      }
    } finally {
      setLoading(null);
    }
  };

  // シリーズに未所属の作品
  const assignedWorkIds = new Set(seriesList.flatMap((s) => s.works.map((w) => w.id)));
  const unassignedWorks = userWorks.filter((w) => !assignedWorkIds.has(w.id));

  return (
    <div className="glass rounded-xl border border-white/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-komapara-text flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          シリーズ管理
        </h2>
        <button
          onClick={() => setCreating(!creating)}
          className="text-xs px-3 py-1 font-medium text-white bg-gradient-main rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          {creating ? "キャンセル" : "+ 新規"}
        </button>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-3 p-2 bg-red-50 text-komapara-like text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* 新規作成 */}
        {creating && (
          <div className="mb-4 p-3 border border-dashed border-primary-300 rounded-lg space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={50}
              placeholder="シリーズタイトル（必須）"
              className="w-full px-3 py-2 text-sm border border-komapara-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              maxLength={200}
              placeholder="説明（任意）"
              className="w-full px-3 py-2 text-sm border border-komapara-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleCreate}
              disabled={loading === "create" || !newTitle.trim()}
              className="w-full py-2 text-sm font-medium text-white bg-gradient-main rounded-lg disabled:opacity-50 transition-all"
            >
              {loading === "create" ? "作成中..." : "シリーズを作成"}
            </button>
          </div>
        )}

        {/* シリーズ一覧 */}
        {seriesList.length === 0 && !creating ? (
          <p className="text-sm text-komapara-muted text-center py-4">
            シリーズがまだありません
          </p>
        ) : (
          <div className="space-y-4">
            {seriesList.map((series) => (
              <div key={series.id} className="border border-komapara-border/50 rounded-lg overflow-hidden">
                {/* シリーズヘッダー */}
                <div className="px-3 py-2 bg-linear-to-r from-blue-50/50 to-blue-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link href={`/series/${series.id}`} className="text-sm font-medium text-komapara-text hover:text-primary-500 truncate">
                      {series.title}
                    </Link>
                    {series.isCompleted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-green-100 text-green-700 shrink-0">
                        完結
                      </span>
                    )}
                    <span className="text-[10px] text-komapara-muted shrink-0">
                      {series.works.length}話
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleComplete(series.id, series.isCompleted)}
                      disabled={loading === `toggle-${series.id}`}
                      className="text-[10px] px-2 py-1 rounded-sm bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                    >
                      {series.isCompleted ? "連載再開" : "完結にする"}
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === series.id ? null : series.id)}
                      className="text-[10px] px-2 py-1 rounded-sm bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      {editingId === series.id ? "閉じる" : "編集"}
                    </button>
                    <button
                      onClick={() => handleDelete(series.id)}
                      disabled={loading === `delete-${series.id}`}
                      className="text-[10px] px-2 py-1 rounded-sm bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* エピソード一覧 */}
                <div className="px-3 py-2">
                  {series.works.length === 0 ? (
                    <p className="text-xs text-komapara-muted py-2">
                      作品を追加してください
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {series.works.map((work, idx) => (
                        <div key={work.id} className="flex items-center gap-2 py-1">
                          <span className="text-[10px] text-komapara-muted w-5 text-center">
                            {idx + 1}
                          </span>
                          <img
                            src={work.panels[0]}
                            alt={work.title}
                            className="w-8 h-8 rounded-sm object-cover shrink-0"
                          />
                          <Link href={`/work/${work.id}`} className="text-xs text-komapara-text hover:text-primary-500 truncate flex-1">
                            {work.title}
                          </Link>
                          {editingId === series.id && (
                            <button
                              onClick={() => handleRemoveWork(series.id, work.id)}
                              disabled={loading === `remove-${work.id}`}
                              className="text-[10px] px-1.5 py-0.5 rounded-sm bg-red-50 text-red-500 hover:bg-red-100 disabled:opacity-50 shrink-0"
                            >
                              除外
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 作品追加（編集モード時） */}
                {editingId === series.id && unassignedWorks.length > 0 && (
                  <div className="px-3 py-2 border-t border-komapara-border/30 bg-gray-50/50">
                    <p className="text-[10px] text-komapara-muted mb-1">
                      未所属の作品を追加:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {unassignedWorks.map((w) => (
                        <button
                          key={w.id}
                          onClick={() => handleAddWork(series.id, w.id)}
                          disabled={loading === `add-${w.id}`}
                          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white border border-komapara-border hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50 transition-colors"
                        >
                          <span className="text-primary-500">+</span>
                          <span className="max-w-[100px] truncate">{w.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
