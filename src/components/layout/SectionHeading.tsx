/**
 * セクション見出し。
 * あしらいは装飾ではなく「ここから別の区画」を示す標識。
 * サイトで唯一のアクセント（青）を細い柱として立てるだけに留め、
 * 主役（作品）より前に出ないようにする。
 */
export function SectionHeading({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2.5">
        <span className="w-1 h-5 rounded-full bg-accent shrink-0" aria-hidden="true" />
        <h2 className="text-lg font-bold text-komapara-text">{children}</h2>
      </div>
      {action}
    </div>
  );
}
