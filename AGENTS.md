<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Database

Daily leaderboard table: **`public.daily_scores`**. PK is **`(player_key, play_date_utc)`** (no `id`). See [`supabase/daily_scores.md`](supabase/daily_scores.md).

`player_key` is the signed-in user’s email (server-derived in `POST /api/spin`), not a client UUID.

## Auth

Google sign-in via **Auth.js** (`next-auth` v5): [`src/auth.ts`](src/auth.ts), route [`src/app/api/auth/[...nextauth]/route.ts`](src/app/api/auth/[...nextauth]/route.ts). Supabase is **database only** (service role); do not enable Google in Supabase Authentication.

Env: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (see [`.env.example`](.env.example)).
