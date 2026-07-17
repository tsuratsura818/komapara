import Link from "next/link";
import { highResAvatar } from "@/lib/utils";

type Creator = {
  id: string;
  name: string | null;
  image: string | null;
  workCount: number;
};

// 帯を流すのは、横に収まりきらない人数がいて初めて意味を持つ。
// これ未満は複製せずそのまま並べる（同じ作家が何度も出るとバグに見える）
const MARQUEE_MIN = 8;

function CreatorChip({ creator, hidden }: { creator: Creator; hidden?: boolean }) {
  return (
    <Link
      href={`/creator/${creator.id}`}
      className="flex items-center gap-2.5 shrink-0 pl-2 pr-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden}
    >
      {creator.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={highResAvatar(creator.image) as string}
          alt=""
          className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100 shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium shrink-0">
          {creator.name?.[0] || "?"}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-komapara-text whitespace-nowrap">{creator.name}</p>
        <p className="text-[11px] text-komapara-muted whitespace-nowrap">{creator.workCount}作品</p>
      </div>
    </Link>
  );
}

/**
 * 参加作家。
 * 人数が少ないうちは静的に並べ、横に収まらない人数になって初めて帯を流す。
 * （少人数で無理に流すと同じ作家が何度も現れて壊れて見える）
 * 流す場合は同じ列を2本並べて継ぎ目なくループし、transformのみで動かす。
 */
export function CreatorMarquee({ creators }: { creators: Creator[] }) {
  if (creators.length === 0) return null;

  if (creators.length < MARQUEE_MIN) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {creators.map((c) => (
          <CreatorChip key={c.id} creator={c} />
        ))}
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden py-1">
      {/* 端をぼかして、画面外へ続いていることを示す */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10 bg-linear-to-r from-komapara-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10 bg-linear-to-l from-komapara-bg to-transparent" />

      <div className="flex w-max animate-marquee gap-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {/* 同じ列を2本並べ、1本ぶん流れたら折り返す＝継ぎ目のないループ */}
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-3 shrink-0">
            {creators.map((c) => (
              <CreatorChip key={`${dup}-${c.id}`} creator={c} hidden={dup === 1} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
