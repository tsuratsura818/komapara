import Link from "next/link";
import { highResAvatar } from "@/lib/utils";

type Creator = {
  id: string;
  name: string | null;
  image: string | null;
  workCount: number;
};

/**
 * 参加作家。
 * 作家は数が読めない（今は1人、増えても数十）ので、件数に依らず成立する
 * 無限スクロールのマーキーにする。1周ぶんを複製して継ぎ目なく流す。
 * CSSアニメーションのみ（transform）でレイアウト再計算を起こさない。
 * 見るためのものではなく「誰が描いているか」を示す帯なので、hoverで停止できるようにする。
 */
export function CreatorMarquee({ creators }: { creators: Creator[] }) {
  if (creators.length === 0) return null;

  // 少人数でも帯が途切れないよう、最低限の長さになるまで繰り返す
  const minItems = 12;
  const repeated: Creator[] = [];
  while (repeated.length < minItems) repeated.push(...creators);
  const lane = repeated.slice(0, Math.max(minItems, creators.length));

  return (
    <div className="group relative overflow-hidden py-1">
      {/* 端をぼかして、画面外へ続いていることを示す */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 z-10 bg-linear-to-r from-komapara-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 z-10 bg-linear-to-l from-komapara-bg to-transparent" />

      <div className="flex w-max animate-marquee gap-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {/* 同じ列を2本並べ、1本ぶん流れたら折り返す＝継ぎ目のないループ */}
        {[0, 1].map((dup) => (
          <div key={dup} className="flex gap-3 shrink-0" aria-hidden={dup === 1}>
            {lane.map((c, i) => (
              <Link
                key={`${dup}-${c.id}-${i}`}
                href={`/creator/${c.id}`}
                className="flex items-center gap-2.5 shrink-0 pl-2 pr-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                tabIndex={dup === 1 ? -1 : undefined}
              >
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={highResAvatar(c.image) as string}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium shrink-0">
                    {c.name?.[0] || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-komapara-text whitespace-nowrap">
                    {c.name}
                  </p>
                  <p className="text-[11px] text-komapara-muted whitespace-nowrap">
                    {c.workCount}作品
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
