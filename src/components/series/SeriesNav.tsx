import Link from "next/link";

type SeriesNavProps = {
  nav: {
    series: { id: string; title: string };
    prev: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
    currentEpisode: number;
    totalEpisodes: number;
  };
};

export function SeriesNav({ nav }: SeriesNavProps) {
  return (
    <div className="px-4 py-4 border-t border-komapara-border/50">
      {/* シリーズ情報 */}
      <Link
        href={`/series/${nav.series.id}`}
        className="flex items-center gap-2 mb-3 group"
      >
        <svg
          className="w-4 h-4 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span className="text-sm font-medium text-komapara-text group-hover:text-primary-500 transition-colors">
          {nav.series.title}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600">
          {nav.currentEpisode}/{nav.totalEpisodes}話
        </span>
      </Link>

      {/* 前後ナビ */}
      <div className="flex gap-2">
        {nav.prev ? (
          <Link
            href={`/work/${nav.prev.id}`}
            className="flex-1 flex items-center gap-2 px-4 py-3 glass rounded-xl hover:bg-white/10 transition-colors"
          >
            <svg
              className="w-4 h-4 text-komapara-muted shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <div className="min-w-0">
              <p className="text-[10px] text-komapara-muted">前の話</p>
              <p className="text-xs font-medium text-komapara-text truncate">
                {nav.prev.title}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {nav.next ? (
          <Link
            href={`/work/${nav.next.id}`}
            className="flex-1 flex items-center justify-end gap-2 px-4 py-3 glass rounded-xl hover:bg-white/10 transition-colors text-right"
          >
            <div className="min-w-0">
              <p className="text-[10px] text-komapara-muted">次の話</p>
              <p className="text-xs font-medium text-komapara-text truncate">
                {nav.next.title}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-komapara-muted shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  );
}
