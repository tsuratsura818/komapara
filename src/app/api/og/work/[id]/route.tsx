import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanCaptionForShare } from "@/lib/utils";
import sharp from "sharp";

export const runtime = "nodejs";

/**
 * パネル画像をOG画像へ埋め込める形にする。
 * next/og(satori)はWebPをデコードできず、そのままURLを渡すと無言で空白になる。
 * コマパラはパネルを全てWebPで保存しているため、JPEGへ変換してdata URIで埋め込む。
 */
async function toEmbeddablePanel(url: string, width: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const jpeg = await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (e) {
    console.error("OG panel embed error:", e);
    return null;
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format"); // "vertical" for LINE/Instagram

    const work = await prisma.work.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        description: true,
        panels: true,
        likeCount: true,
        author: { select: { name: true } },
      },
    });

    if (!work) {
      return new Response("作品が見つかりません", { status: 404 });
    }

    const fontData = await fetch(
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap",
      { signal: AbortSignal.timeout(10000) }
    ).then((res) => res.text())
      .then((css) => {
        const match = css.match(/src: url\((.+?)\) format/);
        if (!match) throw new Error("Font URL not found");
        return fetch(match[1], { signal: AbortSignal.timeout(10000) }).then((res) => res.arrayBuffer());
      });

    const fonts = [
      { name: "Noto Sans JP", data: fontData, style: "normal" as const, weight: 700 as const },
    ];

    // 縦長フォーマット（LINE/Instagram Stories向け 1080x1920）
    if (format === "vertical") {
      const verticalPanels = (
        await Promise.all(work.panels.slice(0, 4).map((p) => toEmbeddablePanel(p, 960)))
      ).filter((p): p is string => Boolean(p));

      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
              fontFamily: '"Noto Sans JP", sans-serif',
              position: "relative",
            }}
          >
            {/* ロゴ上部 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 0 20px",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #8B5CF6, #EC4899)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                コマパラ
              </div>
            </div>

            {/* 4コマ縦並び */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "0 60px",
                gap: 8,
                justifyContent: "center",
              }}
            >
              {verticalPanels.map((panel, i) => (
                <img
                  key={i}
                  src={panel}
                  alt=""
                  width={960}
                  height={340}
                  style={{
                    objectFit: "contain",
                    borderRadius: 12,
                    border: "2px solid rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>

            {/* タイトル・作者 下部 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "20px 40px 50px",
                color: "white",
              }}
            >
              <div
                style={{
                  fontSize: work.title.length > 15 ? 28 : 36,
                  fontWeight: 700,
                  textAlign: "center",
                  marginBottom: 8,
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {work.title}
              </div>
              <div
                style={{
                  fontSize: 20,
                  opacity: 0.8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: "#C084FC" }}>by</span> {work.author.name || "名無し"}
                {work.likeCount > 0 && (
                  <span style={{ marginLeft: 16, display: "flex", alignItems: "center", gap: 4, color: "#F472B6" }}>
                    ♥ {work.likeCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ),
        { width: 1080, height: 1920, fonts }
      );
    }

    // 正方形フォーマット（Instagram Feed向け 1080x1080）
    if (format === "square") {
      const squarePanels = (
        await Promise.all(work.panels.slice(0, 4).map((p) => toEmbeddablePanel(p, 600)))
      ).filter((p): p is string => Boolean(p));

      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #EC4899 100%)",
              fontFamily: '"Noto Sans JP", sans-serif',
              position: "relative",
            }}
          >
            {/* 2x2グリッド */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexWrap: "wrap",
                padding: 30,
                gap: 10,
              }}
            >
              {squarePanels.map((panel, i) => (
                <img
                  key={i}
                  src={panel}
                  alt=""
                  width={500}
                  height={400}
                  style={{
                    objectFit: "contain",
                    borderRadius: 16,
                    border: "3px solid rgba(255,255,255,0.2)",
                    width: "calc(50% - 5px)",
                  }}
                />
              ))}
            </div>

            {/* 下部オーバーレイ */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                display: "flex",
                flexDirection: "column",
                padding: "60px 40px 30px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                color: "white",
              }}
            >
              <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>
                {work.title}
              </div>
              <div style={{ fontSize: 20, opacity: 0.9, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#C084FC" }}>by</span> {work.author.name || "名無し"}
                <span style={{ marginLeft: 16, fontSize: 24, fontWeight: 700 }}>コマパラ</span>
              </div>
            </div>
          </div>
        ),
        { width: 1080, height: 1080, fonts }
      );
    }

    // デフォルト: X/Facebook用 横長（1200x630）。作品そのもの＝1コマ目を主役に、クロップせず全体を見せる
    const panelSrc = work.panels[0] ? await toEmbeddablePanel(work.panels[0], 900) : null;
    const cleanedDesc = cleanCaptionForShare(work.description);
    const ogDesc = cleanedDesc.length >= 10 ? cleanedDesc.slice(0, 90) : "";

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "#ffffff",
            fontFamily: '"Noto Sans JP", sans-serif',
          }}
        >
          {/* 左: 1コマ目を全体表示（objectFit:contain でイラストを切らない） */}
          <div
            style={{
              width: 520,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f1f5f9",
              padding: 36,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 448,
                height: 558,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#ffffff",
                borderRadius: 16,
                boxShadow: "0 12px 40px rgba(15,23,42,0.15)",
                overflow: "hidden",
              }}
            >
              {panelSrc ? (
                <img src={panelSrc} alt="" width={448} height={558} style={{ objectFit: "contain" }} />
              ) : (
                <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#2563eb" }}>コマパラ</div>
              )}
            </div>
          </div>

          {/* 右: テキストエリア */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "56px 56px",
            }}
          >
            {/* コマパラ ラベル */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: "#2563eb", marginRight: 10 }} />
              <div style={{ fontSize: 22, fontWeight: 700, color: "#2563eb" }}>コマパラ</div>
            </div>

            <div
              style={{
                fontSize: work.title.length > 18 ? 40 : 48,
                fontWeight: 700,
                lineHeight: 1.25,
                color: "#0f172a",
                marginBottom: ogDesc ? 20 : 28,
                display: "flex",
              }}
            >
              {work.title}
            </div>

            {ogDesc && (
              <div
                style={{
                  fontSize: 24,
                  lineHeight: 1.6,
                  color: "#475569",
                  marginBottom: 28,
                  display: "flex",
                }}
              >
                {ogDesc}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", fontSize: 22, color: "#64748b" }}>
              <span style={{ marginRight: 8, color: "#2563eb" }}>by</span>
              {work.author.name || "名無し"}
              {work.likeCount > 0 && (
                <span style={{ marginLeft: 20, color: "#94a3b8" }}>♥ {work.likeCount}</span>
              )}
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630, fonts }
    );
  } catch (error) {
    console.error("OGP generation error:", error);
    return new Response("OGP画像の生成に失敗しました", { status: 500 });
  }
}
