import { NextRequest, NextResponse } from "next/server";
import { calculateWeeklyRanking } from "@/lib/ranking";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // CRON_SECRET 未設定なら誰でも叩けてしまうため、明示的に拒否（fail-closed）
    if (!cronSecret) {
      console.error("CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await calculateWeeklyRanking();

    return NextResponse.json({
      message: `ランキング集計完了: ${result.length}件`,
      rankings: result,
    });
  } catch (error) {
    console.error("POST /api/cron/weekly-ranking error:", error);
    return NextResponse.json(
      { error: "ランキング集計に失敗しました" },
      { status: 500 }
    );
  }
}
