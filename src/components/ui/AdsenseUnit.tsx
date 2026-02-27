export function AdsenseUnit({ slot }: { slot: string }) {
  if (!process.env.NEXT_PUBLIC_ADSENSE_ID) {
    return (
      <div
        className="w-full bg-gray-100 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm"
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
