import Link from "next/link";
import Image from "next/image";
import { highResAvatar } from "@/lib/utils";
import { SectionHeading } from "@/components/layout/SectionHeading";

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
 * 巨大なキービジュアルは置かない（宣伝バナー素材が無く、作品が主役）。
 * 幅は装飾でなく中身＝冒頭コマで埋める。回転もしない＝2枚目以降が
 * 見られないカルーセルの弱点を避け、編集判断の1作品に集中させる。
 */
export function WeeklyPickup({ work }: Props) {
  const preview = work.panels.slice(0, 4);

  return (
    <section className="px-4 pt-4">
      <SectionHeading>今週のピックアップ</SectionHeading>

      <Link
        href={`/work/${work.id}`}
        className="group block p-4 sm:p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
      >
        <div className="grid gap-5 md:grid-cols-[minmax(0,240px)_1fr] md:items-center">
          {/* 見出しブロック */}
          <div className="min-w-0">
            {work.tags.length > 0 && (
              <div className="flex gap-1 mb-2 flex-wrap">
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

            <h3 className="text-2xl sm:text-3xl font-bold text-komapara-text leading-tight line-clamp-2">
              {work.title}
            </h3>

            <div className="flex items-center gap-2 mt-3">
              {work.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={highResAvatar(work.author.image) as string}
                  alt={work.author.name || "作家アイコン"}
                  className="w-6 h-6 rounded-full ring-1 ring-blue-100"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100" />
              )}
              <span className="text-sm text-komapara-muted truncate">{work.author.name}</span>
            </div>

            <span className="inline-block mt-4 px-4 py-2 text-sm font-semibold text-white bg-accent rounded-lg group-hover:bg-blue-700 transition-colors">
              読む →
            </span>
          </div>

          {/* 冒頭コマ（切らずに全体を見せる。ここが幅を埋める主役） */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {preview.map((panel, i) => (
              <div
                key={i}
                className="relative aspect-[4/5] rounded-lg overflow-hidden bg-white ring-1 ring-gray-100"
              >
                <Image
                  src={panel}
                  alt={`${work.title} ${i + 1}コマ目`}
                  fill
                  sizes="(max-width: 640px) 45vw, 240px"
                  className="object-contain"
                  priority={i === 0}
                />
              </div>
            ))}
          </div>
        </div>
      </Link>
    </section>
  );
}
