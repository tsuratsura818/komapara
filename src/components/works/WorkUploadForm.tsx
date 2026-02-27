"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GENRES } from "@/lib/utils";

type PanelState = {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  url: string | null;
};

export function WorkUploadForm() {
  const router = useRouter();
  const [panels, setPanels] = useState<PanelState[]>(
    Array.from({ length: 4 }, () => ({
      file: null,
      preview: null,
      uploading: false,
      url: null,
    }))
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [xPostUrl, setXPostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completedWork, setCompletedWork] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleFileSelect = useCallback(
    (index: number, file: File) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("JPEG、PNG、WebPのみ対応しています");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("ファイルサイズは5MB以下にしてください");
        return;
      }
      setError("");

      const preview = URL.createObjectURL(file);
      const newPanels = [...panels];
      newPanels[index] = { ...newPanels[index], file, preview, url: null };
      setPanels(newPanels);
    },
    [panels]
  );

  const handleDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(index, file);
    },
    [handleFileSelect]
  );

  const removePanel = useCallback(
    (index: number) => {
      const newPanels = [...panels];
      if (newPanels[index].preview) {
        URL.revokeObjectURL(newPanels[index].preview!);
      }
      newPanels[index] = {
        file: null,
        preview: null,
        uploading: false,
        url: null,
      };
      setPanels(newPanels);
    },
    [panels]
  );

  const toggleGenre = (slug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3
          ? [...prev, slug]
          : prev
    );
  };

  const uploadPanel = async (index: number): Promise<string | null> => {
    const panel = panels[index];
    if (panel.url) return panel.url;
    if (!panel.file) return null;

    const formData = new FormData();
    formData.append("file", panel.file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`画像${index + 1}のアップロードに失敗しました`);
    }

    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    if (panels.some((p) => !p.file && !p.url)) {
      setError("4枚すべての画像を選択してください");
      return;
    }

    setSubmitting(true);
    try {
      // 画像を並列アップロード
      const urls = await Promise.all(panels.map((_, i) => uploadPanel(i)));

      if (urls.some((u) => !u)) {
        setError("画像のアップロードに失敗しました");
        return;
      }

      // 作品を投稿
      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          panels: urls,
          genreSlugs: selectedGenres.length ? selectedGenres : undefined,
          xPostUrl: xPostUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "投稿に失敗しました");
        return;
      }

      const work = await res.json();
      setCompletedWork({ id: work.id, title: title.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const allPanelsReady = panels.every((p) => p.file || p.url);

  const handleShareToX = () => {
    if (!completedWork) return;
    const workUrl = `${window.location.origin}/work/${completedWork.id}`;
    const text = `${completedWork.title}\n\nコマパラで読む`;
    const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(workUrl)}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer");
  };

  if (completedWork) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-main flex items-center justify-center text-white text-2xl animate-scale-in">
          &#10003;
        </div>
        <h1 className="text-xl font-bold text-komapara-text mb-2">
          投稿完了！
        </h1>
        <p className="text-sm text-komapara-muted mb-8">
          「{completedWork.title}」を投稿しました
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleShareToX}
            className="w-full py-3 text-white font-semibold bg-black rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Xでシェアする
          </button>

          <button
            onClick={() => router.push(`/work/${completedWork.id}`)}
            className="w-full py-3 text-white font-semibold bg-gradient-main rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            作品を見る
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full py-3 text-komapara-muted font-medium glass rounded-xl hover:bg-gray-100 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-komapara-text mb-6">
        4コマを投稿する
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-komapara-like text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* STEP 1: 画像アップロード */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-komapara-text mb-3">
          画像（4枚）
        </h2>
        <div className="space-y-3">
          {panels.map((panel, index) => (
            <div
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(index, e)}
              className="relative"
            >
              {panel.preview ? (
                <div className="relative rounded-lg overflow-hidden border border-komapara-border">
                  <img
                    src={panel.preview}
                    alt={`${index + 1}コマ目`}
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={() => removePanel(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                  >
                    ✕
                  </button>
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}コマ目
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-komapara-border rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-colors">
                  <svg
                    className="w-8 h-8 text-komapara-muted mb-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm text-komapara-muted">
                    {index + 1}コマ目を選択
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(index, file);
                    }}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 2: 作品情報 */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-komapara-text mb-1">
            タイトル <span className="text-komapara-like">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            placeholder="作品のタイトル"
            className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-komapara-muted mt-1 text-right">
            {title.length}/50
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-komapara-text mb-1">
            説明（任意）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="作品の説明"
            className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-komapara-text mb-2">
            ジャンル（最大3つ）
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre.slug}
                type="button"
                onClick={() => toggleGenre(genre.slug)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  selectedGenres.includes(genre.slug)
                    ? "bg-primary-500 text-white"
                    : "bg-komapara-tag text-komapara-tag-text hover:bg-primary-100"
                }`}
              >
                {genre.emoji} {genre.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-komapara-text mb-1">
            Xポスト URL（任意）
          </label>
          <input
            type="url"
            value={xPostUrl}
            onChange={(e) => setXPostUrl(e.target.value)}
            placeholder="https://x.com/..."
            className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* 投稿ボタン */}
      <button
        type="submit"
        disabled={!allPanelsReady || !title.trim() || submitting}
        className="w-full py-3 text-white font-semibold bg-primary-500 rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "投稿中..." : "投稿する"}
      </button>
    </form>
  );
}
