/** Today as `YYYY-MM-DD` in UTC (matches `daily_scores.play_date_utc`). */
export function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}
