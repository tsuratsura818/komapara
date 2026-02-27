import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

type WorkCardProps = {
  id: string;
  title: string;
  panels: string[];
  author: { id: string; name: string | null; image: string | null };
  genres: { name: string; slug: string; emoji: string }[];
  likeCount: number;
  createdAt: string | Date;
};

export function WorkCard({
  id,
  title,
  panels,
  author,
  genres,
  likeCount,
  createdAt,
}: WorkCardProps) {
  return (
    <Link href={`/work/${id}`} className="block group">
      <div className="bg-komapara-card rounded-xl shadow-sm border border-komapara-border overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/10 group-hover:-translate-y-1">
        {/* サムネイル（1コマ目） */}
        <div className="aspect-square relative bg-gray-100 overflow-hidden">
          {panels[0] ? (
            <>
              <img
                src={panels[0]}
                alt={`${title} - 1コマ目`}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
          )}
        </div>

        {/* カード情報 */}
        <div className="p-3">
          {/* ジャンルタグ */}
          {genres.length > 0 && (
            <div className="flex gap-1.5 mb-1.5">
              {genres.slice(0, 2).map((genre) => (
                <span
                  key={genre.slug}
                  className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-50 to-blue-50 text-purple-600 border border-purple-100/50"
                >
                  {genre.emoji} {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* タイトル */}
          <h3 className="text-[15px] font-semibold leading-snug line-clamp-2 text-komapara-text">
            {title}
          </h3>

          {/* 作家名・いいね・投稿日時 */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 min-w-0">
              {author.image ? (
                <img
                  src={author.image}
                  alt={author.name || "作家アイコン"}
                  className="w-5 h-5 rounded-full flex-shrink-0 ring-1 ring-purple-200/50"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0" />
              )}
              <span className="text-sm text-komapara-muted truncate">
                {author.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-pink-500 flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="text-xs">{likeCount}</span>
            </div>
          </div>

          <p className="text-[11px] text-komapara-muted mt-1">
            {formatRelativeTime(createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
