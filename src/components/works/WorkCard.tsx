import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { WorkCardImage } from "./WorkCardImage";

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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/10 group-hover:-translate-y-1 group-hover:border-blue-100">
        {/* サムネイル（1コマ目。イラストを切らないよう原寸比で表示。Instagramの縦長4:5にフィット） */}
        <div className="aspect-[4/5] relative bg-white overflow-hidden">
          {panels[0] ? (
            <>
              <WorkCardImage src={panels[0]} alt={`${title} - 1コマ目`} />
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-50">
              <span className="text-lg font-bold bg-linear-to-r from-blue-500 to-blue-500 bg-clip-text text-transparent select-none">
                コマパラ
              </span>
            </div>
          )}
        </div>

        {/* カード情報 */}
        <div className="p-3">
          {/* ジャンルタグ */}
          {genres.length > 0 && (
            <div className="flex gap-1 mb-1.5 flex-wrap">
              {genres.slice(0, 2).map((genre) => (
                <span
                  key={genre.slug}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 font-medium"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* タイトル */}
          <h3 className="text-[14px] font-bold leading-snug line-clamp-2 text-gray-900">
            {title}
          </h3>

          {/* 作家名・いいね */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={author.image}
                  alt={author.name || "作家アイコン"}
                  className="w-4 h-4 rounded-full shrink-0 ring-1 ring-blue-100"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-linear-to-br from-blue-100 to-blue-100 shrink-0" />
              )}
              <span className="text-[11px] text-gray-400 truncate font-medium">
                {author.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 shrink-0">
              {/* ストロークハートアイコン */}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-[11px] font-medium">{likeCount}</span>
            </div>
          </div>

          <p className="text-[10px] text-gray-300 mt-1.5">
            {formatRelativeTime(createdAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}
