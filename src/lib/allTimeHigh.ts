import type { SupabaseClient } from "@supabase/supabase-js";

export type AllTimeHigh = {
  player_key: string;
  score: number;
  play_date_utc: string;
  created_at: string;
};

/** Highest `score` in `daily_scores` across all dates. */
export async function getAllTimeHigh(
  supabase: SupabaseClient,
): Promise<AllTimeHigh | null> {
  const { data, error } = await supabase
    .from("daily_scores")
    .select("player_key, score, play_date_utc, created_at")
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
