import Link from "next/link";
import Image from "next/image";
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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/10 group-hover:-translate-y-1 group-hover:border-purple-100">
        {/* サムネイル（1コマ目） */}
        <div className="aspect-square relative bg-gray-50 overflow-hidden">
          {panels[0] ? (
            <>
              <Image
                src={panels[0]}
                alt={`${title} - 1コマ目`}
                width={400}
                height={400}
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 16vw"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              {/* シンプルな画像プレースホルダーアイコン（ストローク） */}
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
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
                  className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100/60 font-medium"
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
                  className="w-4 h-4 rounded-full flex-shrink-0 ring-1 ring-purple-100"
                />
              ) : (
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex-shrink-0" />
              )}
              <span className="text-[11px] text-gray-400 truncate font-medium">
                {author.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
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
