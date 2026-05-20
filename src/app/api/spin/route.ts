import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { apiErrorResponse } from "@/lib/apiDebug";
import { todayUtcDate } from "@/lib/playDate";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const STARTING_SCORE = 100;

export async function POST() {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
        return NextResponse.json({ message: "Sign in required" }, { status: 401 });
    }

    const playerKey = email.toLowerCase().trim();
    const play_date_utc = todayUtcDate();
    console.log("[POST /api/spin] start", { playerKey, play_date_utc });

    let supabase;
    try {
        supabase = getSupabaseAdmin();
    } catch (e) {
        return apiErrorResponse("spin:supabaseClient", e, 500, {
            hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
            hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        });
    }

    try {

        const { data: row, error: lookupError } = await supabase
            .from("daily_scores")
            .select("score, Lost")
            .eq("player_key", playerKey)
            .eq("play_date_utc", play_date_utc)
            .maybeSingle();

        if (lookupError) {
            return apiErrorResponse("spin:lookup", lookupError, 500, {
                playerKey,
                play_date_utc,
            });
        }

        console.log("[POST /api/spin] lookup", { row: row ?? null });

        if (row?.Lost) {
            return NextResponse.json(
                { message: "Already played today" },
                { status: 409 },
            );
        }

        const score = row?.score ?? STARTING_SCORE;
        const win = Math.random() < 0.5;
        const nextScore = win ? score * 2 : score;

        const payload = {
            player_key: playerKey,
            play_date_utc,
            score: nextScore,
            Lost: !win,
            display_name: null,
        };

        console.log("[POST /api/spin] upsert", { win, payload });

        const { data: upsertData, error: upsertError } = await supabase
            .from("daily_scores")
            .upsert(payload, { onConflict: "player_key,play_date_utc" })
            .select("player_key, play_date_utc, score, Lost")
            .maybeSingle();

        if (upsertError) {
            return apiErrorResponse("spin:upsert", upsertError, 500, {
                playerKey,
                play_date_utc,
                payload,
                hint:
                    upsertError.code === "42P10"
                        ? "Primary key must be (player_key, play_date_utc) for upsert onConflict"
                        : undefined,
            });
        }

        console.log("[POST /api/spin] ok", { upsertData });

        return NextResponse.json({
            result: win ? "W" : "L",
            score: nextScore,
            lost: !win,
        });
    } catch (e) {
        return apiErrorResponse("spin:unexpected", e, 500, {
            playerKey,
            play_date_utc,
        });
    }
}
