-- Only needed if primary key is NOT already (player_key, play_date_utc).
-- If you use composite PK on those columns, upsert onConflict works without this.

-- alter table public.daily_scores
--   add constraint daily_scores_player_date_uniq unique (player_key, play_date_utc);
