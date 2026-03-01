import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format"); // "vertical" for LINE/Instagram

    const work = await prisma.work.findUnique({
      where: { id: params.id },
      select: {
        title: true,
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
              {work.panels.map((panel, i) => (
                <img
                  key={i}
                  src={panel}
                  alt=""
                  width={960}
                  height={340}
                  style={{
                    objectFit: "cover",
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
              {work.panels.map((panel, i) => (
                <img
                  key={i}
                  src={panel}
                  alt=""
                  width={500}
                  height={400}
                  style={{
                    objectFit: "cover",
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

    // デフォルト: X/Facebook用 横長（1200x630）
    const panelUrl = work.panels[0] || null;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #EC4899 100%)",
            fontFamily: '"Noto Sans JP", sans-serif',
            position: "relative",
          }}
        >
          {/* 左: 1コマ目画像 */}
          <div
            style={{
              width: 420,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 30,
              flexShrink: 0,
            }}
          >
            {panelUrl ? (
              <img
                src={panelUrl}
                alt=""
                width={360}
                height={360}
                style={{
                  objectFit: "cover",
                  borderRadius: 20,
                  border: "4px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 360,
                  height: 360,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 60,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                4コマ
              </div>
            )}
          </div>

          {/* 右: テキストエリア */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "40px 50px 40px 20px",
              color: "white",
            }}
          >
            <div
              style={{
                fontSize: work.title.length > 20 ? 36 : 44,
                fontWeight: 700,
                lineHeight: 1.3,
                marginBottom: 20,
                display: "-webkit-box",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textShadow: "0 2px 10px rgba(0,0,0,0.3)",
              }}
            >
              {work.title}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 24,
                opacity: 0.9,
                marginBottom: 16,
              }}
            >
              <span style={{ marginRight: 8, color: "#C084FC" }}>by</span>
              {work.author.name || "名無し"}
            </div>

            {work.likeCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 20,
                  opacity: 0.8,
                  color: "#F472B6",
                }}
              >
                <span style={{ marginRight: 6 }}>♥</span>
                {work.likeCount}
              </div>
            )}
          </div>

          {/* ロゴ（右下） */}
          <div
            style={{
              position: "absolute",
              bottom: 30,
              right: 40,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "white",
                opacity: 0.9,
                textShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              コマパラ
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
