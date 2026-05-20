import { NextResponse } from "next/server";

import { getAllTimeHigh } from "@/lib/allTimeHigh";
import { todayUtcDate } from "@/lib/playDate";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const playDate = todayUtcDate();

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("daily_scores")
      .select(
        "player_key, play_date_utc, score, display_name, created_at, Lost",
      )
      .eq("play_date_utc", playDate)
      .order("score", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    let allTimeHigh = null;
    try {
      allTimeHigh = await getAllTimeHigh(supabase);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Server error";
      return NextResponse.json({ message }, { status: 500 });
    }

    return NextResponse.json({
      playDateUtc: playDate,
      scores: data ?? [],
      allTimeHigh,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
