import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap"
    ).then((res) => res.text())
      .then((css) => {
        const match = css.match(/src: url\((.+?)\) format/);
        if (!match) throw new Error("Font URL not found");
        return fetch(match[1]).then((res) => res.arrayBuffer());
      });

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
                  fontSize: 80,
                }}
              >
                🖼️
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
            {/* タイトル */}
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

            {/* 作家名 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 24,
                opacity: 0.9,
                marginBottom: 16,
              }}
            >
              <span style={{ marginRight: 8 }}>✏️</span>
              {work.author.name || "名無し"}
            </div>

            {/* いいね数 */}
            {work.likeCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 20,
                  opacity: 0.8,
                }}
              >
                <span style={{ marginRight: 8 }}>❤️</span>
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
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Noto Sans JP",
            data: fontData,
            style: "normal",
            weight: 700,
          },
        ],
      }
    );
  } catch (error) {
    console.error("OGP generation error:", error);
    return new Response("OGP画像の生成に失敗しました", { status: 500 });
  }
}
