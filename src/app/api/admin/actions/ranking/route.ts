import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { calculateWeeklyRanking } from "@/lib/ranking";

export async function POST() {
  const { error } = await requireAdminApi();
  if (error) return error;

  try {
    const result = await calculateWeeklyRanking();
    return NextResponse.json({
      message: `ランキング集計完了: ${result.length}件`,
      count: result.length,
    });
  } catch (err) {
    console.error("POST /api/admin/actions/ranking error:", err);
    return NextResponse.json(
      { error: "ランキング集計に失敗しました" },
      { status: 500 }
    );
  }
}
