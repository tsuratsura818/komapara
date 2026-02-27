export function AdsenseUnit({ slot }: { slot: string }) {
  if (!process.env.NEXT_PUBLIC_ADSENSE_ID) {
    return (
      <div
        className="w-full glass rounded-xl border border-dashed border-purple-200/50 flex items-center justify-center text-komapara-muted text-sm"
        style={{ minHeight: 100 }}
      >
        広告スペース（{slot}）
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
