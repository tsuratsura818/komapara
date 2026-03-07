import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  tilt?: number;
  className?: string;
  scale?: number;
};

export function IPhoneMockup({ children, tilt = 0, className = "", scale = 1 }: Props) {
  return (
    <div
      className={className}
      style={{
        transform: `rotate(${tilt}deg) scale(${scale})`,
        transformOrigin: "center top",
        position: "relative",
        width: "220px",
        flexShrink: 0,
      }}
    >
      {/* アクションボタン（左上） */}
      <div
        style={{
          position: "absolute",
          left: "-3.5px",
          top: "76px",
          width: "3.5px",
          height: "28px",
          background: "linear-gradient(180deg, #48484a 0%, #3a3a3c 100%)",
          borderRadius: "2px 0 0 2px",
          boxShadow: "-1px 0 2px rgba(0,0,0,0.4)",
          zIndex: 20,
        }}
      />
      {/* 音量＋ボタン（左中） */}
      <div
        style={{
          position: "absolute",
          left: "-3.5px",
          top: "118px",
          width: "3.5px",
          height: "38px",
          background: "linear-gradient(180deg, #48484a 0%, #3a3a3c 100%)",
          borderRadius: "2px 0 0 2px",
          boxShadow: "-1px 0 2px rgba(0,0,0,0.4)",
          zIndex: 20,
        }}
      />
      {/* 音量－ボタン（左下） */}
      <div
        style={{
          position: "absolute",
          left: "-3.5px",
          top: "168px",
          width: "3.5px",
          height: "38px",
          background: "linear-gradient(180deg, #48484a 0%, #3a3a3c 100%)",
          borderRadius: "2px 0 0 2px",
          boxShadow: "-1px 0 2px rgba(0,0,0,0.4)",
          zIndex: 20,
        }}
      />
      {/* 電源ボタン（右） */}
      <div
        style={{
          position: "absolute",
          right: "-3.5px",
          top: "136px",
          width: "3.5px",
          height: "70px",
          background: "linear-gradient(180deg, #48484a 0%, #3a3a3c 100%)",
          borderRadius: "0 2px 2px 0",
          boxShadow: "1px 0 2px rgba(0,0,0,0.4)",
          zIndex: 20,
        }}
      />

      {/* 外枠フレーム（チタン/アルミ質感） */}
      <div
        style={{
          borderRadius: "50px",
          background: "linear-gradient(145deg, #5a5a5e 0%, #1c1c1e 25%, #2c2c2e 55%, #4a4a4e 80%, #5a5a5e 100%)",
          padding: "10px",
          boxShadow: [
            "0 0 0 0.5px rgba(255,255,255,0.18)",
            "0 0 0 1px rgba(0,0,0,0.8)",
            "0 24px 80px rgba(0,0,0,0.55)",
            "0 8px 24px rgba(0,0,0,0.35)",
            "inset 0 1px 0 rgba(255,255,255,0.12)",
            "inset 0 -1px 0 rgba(0,0,0,0.4)",
          ].join(", "),
          position: "relative",
        }}
      >
        {/* スクリーン */}
        <div
          style={{
            borderRadius: "42px",
            overflow: "hidden",
            background: "#000",
            position: "relative",
            aspectRatio: "9 / 19.5",
            boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,0.05)",
          }}
        >
          {/* Dynamic Island */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "115px",
              height: "33px",
              background: "#000",
              borderRadius: "20px",
              zIndex: 10,
              boxShadow: "0 0 0 1.5px #111",
            }}
          />

          {/* ステータスバー左（時刻） */}
          <div
            style={{
              position: "absolute",
              top: "18px",
              left: "22px",
              fontSize: "11px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "0.3px",
              zIndex: 5,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            9:41
          </div>

          {/* ステータスバー右（バッテリー/電波） */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "22px",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              zIndex: 5,
            }}
          >
            {/* 電波 */}
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
              <rect x="0" y="7" width="3" height="4" rx="0.5" fill="rgba(255,255,255,0.85)" />
              <rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="rgba(255,255,255,0.85)" />
              <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill="rgba(255,255,255,0.85)" />
              <rect x="13.5" y="0" width="2.5" height="11" rx="0.5" fill="rgba(255,255,255,0.35)" />
            </svg>
            {/* WiFi */}
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
              <path d="M7 8.5C7.83 8.5 8.5 9.17 8.5 10S7.83 11.5 7 11.5 5.5 10.83 5.5 10 6.17 8.5 7 8.5z" fill="rgba(255,255,255,0.85)" />
              <path d="M3.5 6.5C4.5 5.2 5.65 4.5 7 4.5s2.5.7 3.5 2" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
              <path d="M1 4C2.8 2 4.75 1 7 1s4.2 1 6 3" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </svg>
            {/* バッテリー */}
            <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
              <div style={{
                width: "22px", height: "11px", border: "1px solid rgba(255,255,255,0.65)",
                borderRadius: "3px", padding: "1.5px", position: "relative",
              }}>
                <div style={{
                  width: "80%", height: "100%",
                  background: "rgba(255,255,255,0.85)", borderRadius: "1.5px",
                }} />
              </div>
              <div style={{
                width: "2px", height: "5px",
                background: "rgba(255,255,255,0.5)", borderRadius: "0 1px 1px 0",
              }} />
            </div>
          </div>

          {/* アプリコンテンツ */}
          <div style={{ paddingTop: "54px", height: "100%", overflow: "hidden" }}>
            {children}
          </div>

          {/* ホームインジケーター */}
          <div
            style={{
              position: "absolute",
              bottom: "8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "120px",
              height: "4px",
              background: "rgba(255,255,255,0.38)",
              borderRadius: "3px",
            }}
          />

          {/* スクリーン反射 */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 45%, transparent 65%, rgba(255,255,255,0.02) 100%)",
              pointerEvents: "none",
              borderRadius: "inherit",
            }}
          />
        </div>
      </div>
    </div>
  );
}
