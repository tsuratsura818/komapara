"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GENRES } from "@/lib/utils";

type PanelState = {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  url: string | null;
};

type SeriesOption = { id: string; title: string };

const MIN_PANELS = 1;
const MAX_PANELS = 16;
const DEFAULT_PANELS = 4;

function emptyPanel(): PanelState {
  return { file: null, preview: null, uploading: false, url: null };
}

export function WorkUploadForm({ userSeries = [] }: { userSeries?: SeriesOption[] }) {
  const router = useRouter();
  const [panelCount, setPanelCount] = useState(DEFAULT_PANELS);
  const [panels, setPanels] = useState<PanelState[]>(
    Array.from({ length: DEFAULT_PANELS }, emptyPanel)
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [xPostUrl, setXPostUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importingIg, setImportingIg] = useState(false);
  const [importUrlIg, setImportUrlIg] = useState("");
  const [error, setError] = useState("");
  const [completedWork, setCompletedWork] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // エラーが設定されたら自動スクロールで表示する
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  // パネル枚数を変更する
  const changePanelCount = (newCount: number) => {
    const clamped = Math.max(MIN_PANELS, Math.min(MAX_PANELS, newCount));
    setPanelCount(clamped);
    setPanels((prev) => {
      if (clamped > prev.length) {
        return [...prev, ...Array.from({ length: clamped - prev.length }, emptyPanel)];
      }
      if (clamped < prev.length) {
        // 削除されるパネルのプレビューURLを解放
        for (let i = clamped; i < prev.length; i++) {
          if (prev[i].preview && prev[i].file) {
            URL.revokeObjectURL(prev[i].preview!);
          }
        }
        return prev.slice(0, clamped);
      }
      return prev;
    });
  };

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
      newPanels[index] = emptyPanel();
      setPanels(newPanels);
    },
    [panels]
  );

  const handleImportFromX = async () => {
    if (!importUrl.trim()) {
      setError("X投稿のURLを入力してください");
      return;
    }
    setError("");
    setImporting(true);
    try {
      const res = await fetch("/api/import-from-x", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/upload");
          return;
        }
        setError(data.error || "インポートに失敗しました");
        return;
      }

      // 画像をパネルにセット（取得枚数に合わせてパネル数を調整）
      const imageCount = Math.min(data.images.length, MAX_PANELS);
      if (imageCount > panelCount) {
        changePanelCount(imageCount);
      }
      const newPanels = Array.from(
        { length: Math.max(panelCount, imageCount) },
        (_, i) => panels[i] ? { ...panels[i] } : emptyPanel()
      );
      for (let i = 0; i < imageCount; i++) {
        newPanels[i] = {
          file: null,
          preview: data.images[i],
          uploading: false,
          url: data.images[i],
        };
      }
      setPanels(newPanels);
      if (imageCount > panelCount) {
        setPanelCount(imageCount);
      }

      // X投稿URLと説明を自動入力
      setXPostUrl(data.xPostUrl || importUrl.trim());
      if (!description && data.text) {
        const cleanText = data.text
          .replace(/https?:\/\/\S+/g, "")
          .replace(/#\S+/g, "")
          .trim();
        if (cleanText) setDescription(cleanText.slice(0, 200));
      }
    } catch {
      setError("インポートに失敗しました");
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromInstagram = async () => {
    if (!importUrlIg.trim()) {
      setError("Instagram投稿のURLを入力してください");
      return;
    }
    setError("");
    setImportingIg(true);
    try {
      const res = await fetch("/api/import-from-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrlIg.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/upload");
          return;
        }
        setError(data.error || "インポートに失敗しました");
        return;
      }

      // 画像をパネルにセット
      const imageCount = Math.min(data.images.length, MAX_PANELS);
      if (imageCount > panelCount) {
        changePanelCount(imageCount);
      }
      const newPanels = Array.from(
        { length: Math.max(panelCount, imageCount) },
        (_, i) => panels[i] ? { ...panels[i] } : emptyPanel()
      );
      for (let i = 0; i < imageCount; i++) {
        newPanels[i] = {
          file: null,
          preview: data.images[i],
          uploading: false,
          url: data.images[i],
        };
      }
      setPanels(newPanels);
      if (imageCount > panelCount) {
        setPanelCount(imageCount);
      }

      // 説明を自動入力
      if (!description && data.text) {
        const cleanText = data.text
          .replace(/https?:\/\/\S+/g, "")
          .replace(/#\S+/g, "")
          .trim();
        if (cleanText) setDescription(cleanText.slice(0, 200));
      }
    } catch {
      setError("インポートに失敗しました");
    } finally {
      setImportingIg(false);
    }
  };

  const toggleGenre = (slug: string) => {
    setSelectedGenres((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3
          ? [...prev, slug]
          : prev
    );
  };

  const uploadPanel = async (index: number): Promise<string> => {
    const panel = panels[index];
    if (panel.url) return panel.url;
    if (!panel.file) throw new Error(`画像${index + 1}が選択されていません`);

    setPanels((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], uploading: true };
      return next;
    });

    try {
      const formData = new FormData();
      formData.append("file", panel.file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/upload");
          throw new Error("ログインが必要です");
        }
        let message = `画像${index + 1}のアップロードに失敗しました`;
        try {
          const errData = await res.json();
          if (errData.error) message = errData.error;
        } catch {
          // レスポンスがJSONでない場合はデフォルトメッセージを使用
        }
        throw new Error(message);
      }

      const data = await res.json();
      if (!data.url) throw new Error(`画像${index + 1}のURLが取得できませんでした`);
      return data.url;
    } finally {
      setPanels((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], uploading: false };
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    if (panels.some((p) => !p.file && !p.url)) {
      setError(`${panelCount}枚すべての画像を選択してください`);
      return;
    }

    setSubmitting(true);
    try {
      const urls = await Promise.all(panels.map((_, i) => uploadPanel(i)));

      const res = await fetch("/api/works", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          panels: urls,
          genreSlugs: selectedGenres.length ? selectedGenres : undefined,
          seriesId: selectedSeriesId || undefined,
          xPostUrl: xPostUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login?callbackUrl=/upload");
          return;
        }
        let message = "投稿に失敗しました";
        try {
          const data = await res.json();
          if (data.error) message = data.error;
        } catch {
          // レスポンスがJSONでない場合はデフォルトメッセージを使用
        }
        setError(message);
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
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-komapara-text mb-6">
        作品を投稿する
      </h1>

      {error && (
        <div ref={errorRef} className="mb-4 p-3 bg-red-50 text-komapara-like text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Xからインポート */}
      <div className="mb-6 p-4 glass rounded-xl border border-white/20">
        <h2 className="text-sm font-semibold text-komapara-text mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Xからインポート
        </h2>
        <p className="text-xs text-komapara-muted mb-3">
          X投稿のURLを貼り付けると、画像を自動取得します
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://x.com/user/status/..."
            className="flex-1 px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={importing}
          />
          <button
            type="button"
            onClick={handleImportFromX}
            disabled={importing || !importUrl.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {importing ? "取得中..." : "取得"}
          </button>
        </div>
      </div>

      {/* Instagramからインポート */}
      <div className="mb-6 p-4 glass rounded-xl border border-white/20">
        <h2 className="text-sm font-semibold text-komapara-text mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Instagramからインポート
        </h2>
        <p className="text-xs text-komapara-muted mb-3">
          Instagram投稿のURLを貼り付けると、画像を自動取得します
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={importUrlIg}
            onChange={(e) => setImportUrlIg(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            className="flex-1 px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={importingIg}
          />
          <button
            type="button"
            onClick={handleImportFromInstagram}
            disabled={importingIg || !importUrlIg.trim()}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
          >
            {importingIg ? "取得中..." : "取得"}
          </button>
        </div>
      </div>

      {/* STEP 1: 画像アップロード */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-komapara-text">
            画像（{panelCount}枚）
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changePanelCount(panelCount - 1)}
              disabled={panelCount <= MIN_PANELS}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-komapara-border text-komapara-muted hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
            >
              -
            </button>
            <span className="text-sm font-medium text-komapara-text w-8 text-center">
              {panelCount}
            </span>
            <button
              type="button"
              onClick={() => changePanelCount(panelCount + 1)}
              disabled={panelCount >= MAX_PANELS}
              className="w-7 h-7 flex items-center justify-center rounded-full border border-komapara-border text-komapara-muted hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm font-bold"
            >
              +
            </button>
          </div>
        </div>
        <p className="text-xs text-komapara-muted mb-3">{MIN_PANELS}〜{MAX_PANELS}枚まで設定可</p>
        <div className="space-y-3">
          {panels.map((panel, index) => (
            <div
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(index, e)}
              className="relative"
            >
              {panel.preview ? (
                <div className="relative rounded-lg border border-komapara-border">
                  <img
                    src={panel.preview}
                    alt={`${index + 1}コマ目`}
                    className={`w-full h-auto rounded-lg transition-opacity ${panel.uploading ? "opacity-50" : ""}`}
                  />
                  {panel.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePanel(index)}
                    disabled={submitting}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 disabled:opacity-50"
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

        {userSeries.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-komapara-text mb-1">
              シリーズ（任意）
            </label>
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">シリーズなし（単発）</option>
              {userSeries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

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

      {/* エラー表示（ボタン直上にも表示） */}
      {error && (
        <div className="mb-3 p-3 bg-red-50 text-komapara-like text-sm rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* 投稿ボタン */}
      <button
        type="submit"
        disabled={!allPanelsReady || !title.trim() || submitting}
        className="w-full py-3 text-white font-semibold bg-primary-500 rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "投稿中..." : "投稿する"}
      </button>

      {/* ボタン無効の理由を表示 */}
      {!submitting && (!allPanelsReady || !title.trim()) && (
        <p className="mt-2 text-xs text-komapara-muted text-center">
          {!allPanelsReady && !title.trim()
            ? `画像をあと${panels.filter((p) => !p.file && !p.url).length}枚選択し、タイトルを入力してください`
            : !allPanelsReady
              ? `画像をあと${panels.filter((p) => !p.file && !p.url).length}枚選択してください`
              : "タイトルを入力してください"}
        </p>
      )}
    </form>
  );
}
