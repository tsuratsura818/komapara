"use client";

import { GENRES } from "@/lib/utils";
import { PanelState, SeriesOption } from "./types";
import { PanelPreview } from "./PanelPreview";

type Props = {
  panels: PanelState[];
  title: string;
  description: string;
  selectedGenres: string[];
  selectedSeriesId: string;
  xPostUrl: string;
  userSeries: SeriesOption[];
  submitting: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onGenresChange: (v: string[]) => void;
  onSeriesChange: (v: string) => void;
  onXPostUrlChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function WorkInfoForm({
  panels,
  title,
  description,
  selectedGenres,
  selectedSeriesId,
  xPostUrl,
  userSeries,
  submitting,
  onTitleChange,
  onDescriptionChange,
  onGenresChange,
  onSeriesChange,
  onXPostUrlChange,
  onSubmit,
  onBack,
}: Props) {
  const toggleGenre = (slug: string) => {
    if (selectedGenres.includes(slug)) {
      onGenresChange(selectedGenres.filter((s) => s !== slug));
    } else if (selectedGenres.length < 3) {
      onGenresChange([...selectedGenres, slug]);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <button
        onClick={onBack}
        disabled={submitting}
        className="text-sm text-komapara-muted hover:text-komapara-text mb-4 flex items-center gap-1 disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        戻る
      </button>

      <h1 className="text-xl font-bold text-komapara-text mb-4">作品情報を入力</h1>

      {/* 画像サムネイル */}
      <div className="mb-6">
        <PanelPreview panels={panels} compact />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-komapara-text mb-1">
            タイトル <span className="text-komapara-like">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={50}
            placeholder="作品のタイトル"
            className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
          <p className="text-xs text-komapara-muted mt-1 text-right">{title.length}/50</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-komapara-text mb-1">説明（任意）</label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="作品の説明"
            className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-komapara-text mb-2">ジャンル（最大3つ）</label>
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
            <label className="block text-sm font-semibold text-komapara-text mb-1">シリーズ（任意）</label>
            <select
              value={selectedSeriesId}
              onChange={(e) => onSeriesChange(e.target.value)}
              className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">シリーズなし（単発）</option>
              {userSeries.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-komapara-text mb-1">Xポスト URL（任意）</label>
          <input
            type="url"
            value={xPostUrl}
            onChange={(e) => onXPostUrlChange(e.target.value)}
            placeholder="https://x.com/..."
            className="w-full px-3 py-2 border border-komapara-border rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!title.trim() || submitting}
        className="w-full mt-6 py-3 text-white font-semibold bg-primary-500 rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "投稿中..." : "投稿する"}
      </button>
      {!submitting && !title.trim() && (
        <p className="mt-2 text-xs text-komapara-muted text-center">タイトルを入力してください</p>
      )}
    </div>
  );
}
