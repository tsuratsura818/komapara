"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdsenseUnit({
  slot,
  isPremium = false,
}: {
  slot: string;
  isPremium?: boolean;
}) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_ID;
  const pushed = useRef(false);

  // <ins> を配置しただけでは広告は出ない。マウント後に adsbygoogle へ
  // push して初めて枠が埋まる。StrictModeの二重実行で二重pushすると
  // 「All ins elements ... already have ads」で例外になるためガードする
  useEffect(() => {
    if (isPremium || !clientId || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      console.error("adsense push failed:", e);
    }
  }, [isPremium, clientId]);

  // プレミアム会員は広告非表示。ID未設定の環境（開発・審査前）も何も出さない
  if (isPremium || !clientId) return null;

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
