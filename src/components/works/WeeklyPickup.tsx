import Link from "next/link";
import Image from "next/image";
import { highResAvatar } from "@/lib/utils";

type Props = {
  work: {
    id: string;
    title: string;
    panels: string[];
    author: { id: string; name: string | null; image: string | null };
    tags: { name: string; slug: string; emoji: string }[];
  };
};

/**
 * 今週のピックアップ。
 * 巨大なキービジュアルは置かず、1コマ目そのものを見せる（作品が主役／宣伝バナー素材が無い）。
 * 回転もしない＝2枚目以降が見られないカルーセルの弱点を避け、編集判断の1作品に集中させる。
 */
export function WeeklyPickup({ work }: Props) {
  return (
    <section className="px-4 pt-4" aria-labelledby="pickup-heading">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        <h2 id="pickup-heading" className="text-xs font-bold tracking-wide text-accent">
          今週のピックアップ
        </h2>
      </div>

      <Link
        href={`/work/${work.id}`}
        className="group flex gap-4 p-3 sm:p-4 bg-white rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
      >
        {/* 1コマ目（切らずに全体を見せる） */}
        <div className="relative w-24 sm:w-32 shrink-0 aspect-[4/5] rounded-xl overflow-hidden bg-white">
          {work.panels[0] && (
            <Image
              src={work.panels[0]}
              alt={`${work.title} 1コマ目`}
              fill
              sizes="128px"
              className="object-contain"
              priority
            />
          )}
        </div>

        <div className="flex flex-col justify-center min-w-0">
          {work.tags.length > 0 && (
            <div className="flex gap-1 mb-1.5 flex-wrap">
              {work.tags.slice(0, 2).map((t) => (
                <span
                  key={t.slug}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100/60 font-medium"
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}

          <h3 className="text-base sm:text-lg font-bold text-komapara-text leading-snug line-clamp-2">
            {work.title}
          </h3>

          <div className="flex items-center gap-1.5 mt-2">
            {work.author.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={highResAvatar(work.author.image) as string}
                alt={work.author.name || "作家アイコン"}
                className="w-5 h-5 rounded-full ring-1 ring-blue-100"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-100" />
            )}
            <span className="text-xs text-komapara-muted truncate">{work.author.name}</span>
          </div>

          <span className="mt-3 text-xs font-semibold text-accent group-hover:underline">
            読む →
          </span>
        </div>
      </Link>
    </section>
  );
}
