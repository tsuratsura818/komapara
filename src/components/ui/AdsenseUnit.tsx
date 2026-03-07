export function AdsenseUnit({
  slot,
  isPremium = false,
}: {
  slot: string;
  isPremium?: boolean;
}) {
  // プレミアム会員は広告非表示
  if (isPremium) return null;

  if (!process.env.NEXT_PUBLIC_ADSENSE_ID) {
    return null;
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
