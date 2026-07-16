/**
 * ヘッダー直下に出すページ見出し。
 * 見出しの無いページは「今どこにいるか」が分からないため、表記を1箇所に揃える。
 * ホーム（開いた瞬間に4コマ）と作品ページ（作品名がそのまま見出し）には置かない。
 */
export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="px-4 pt-5 pb-2">
      <h1 className="text-lg font-bold text-komapara-text">{children}</h1>
      {sub && <p className="text-xs text-komapara-muted mt-0.5">{sub}</p>}
    </div>
  );
}
