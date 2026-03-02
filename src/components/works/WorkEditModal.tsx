"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GENRES } from "@/lib/utils";

type WorkEditModalProps = {
  work: {
    id: string;
    title: string;
    description: string | null;
    genres: { slug: string }[];
  };
  onClose: () => void;
};

export function WorkEditModal({ work, onClose }: WorkEditModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(work.title);
  const [description, setDescription] = useState(work.description || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    work.genres.map((g) => g.slug)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleGenre = (slug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/works/${work.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          genreSlugs: selectedGenres,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "更新に失敗しました");
      }
      router.refresh();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-scale-in">
        <h2 className="text-lg font-bold gradient-text">作品を編集</h2>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg p-2">{error}</p>
        )}

        <div>
          <label className="text-xs font-medium text-komapara-muted block mb-1">
            タイトル
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 text-sm glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-komapara-muted block mb-1">
            説明（任意）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 text-sm glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-komapara-muted block mb-1">
            カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre.slug}
                type="button"
                onClick={() => toggleGenre(genre.slug)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                  selectedGenres.includes(genre.slug)
                    ? "bg-gradient-main text-white shadow-md shadow-purple-500/25"
                    : "glass text-komapara-muted hover:text-komapara-text"
                }`}
              >
                {genre.emoji} {genre.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm glass rounded-xl text-komapara-muted hover:text-komapara-text transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-main rounded-xl hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 transition-all"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
