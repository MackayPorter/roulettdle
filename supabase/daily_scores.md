# `public.daily_scores`

Source of truth for daily leaderboard rows. Used by **`GET /api/scores`** and **`POST /api/spin`**.

## Table definition

```sql
create table public.daily_scores (
  player_key text not null,
  play_date_utc date not null,
  score integer not null,
  display_name text null,
  created_at timestamp with time zone not null default now(),
  "Lost" boolean not null default false,
  constraint daily_scores_pkey primary key (player_key, play_date_utc)
);
```

## Columns

| Column | Type | Notes |
|--------|------|--------|
| `player_key` | `text` | Part of PK; authenticated Google account email (lowercased), set server-side via Auth.js session. |
| `play_date_utc` | `date` | Part of PK; UTC calendar day (`YYYY-MM-DD`). |
| `score` | `integer` | Current / final score for that day. |
| `display_name` | `text` | Optional; nullable. |
| `created_at` | `timestamptz` | Default `now()` on insert. |
| `"Lost"` | `boolean` | Default `false`; `true` when the run ended on a loss. |

## App mapping

- **`POST /api/spin`**: requires Auth.js session; `player_key` = `session.user.email` (normalized). Upsert on `(player_key, play_date_utc)` — win doubles `score`, loss sets **`Lost: true`**.
- **`GET /api/scores`**: today’s leaderboard (no `id` column); `allTimeHigh` = highest `score` in this table across all dates.
- Browser cache: `src/lib/dailyPlayCache.ts` for “played today” UX.

## Environment

**Database (Supabase only — not used for auth):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Auth (Auth.js + Google OAuth):**

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Google Cloud redirect URI: `https://<your-domain>/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google` for dev).

See [`.env.example`](../.env.example).
