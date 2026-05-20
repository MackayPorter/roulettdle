import { todayUtcDate } from "@/lib/playDate";

const CACHE_KEY = "roulettdle_daily_play";

type DailyPlayCache = {
  playDateUtc: string;
  lost: boolean;
  email?: string;
};

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function readCache(): DailyPlayCache | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "playDateUtc" in parsed &&
      typeof (parsed as DailyPlayCache).playDateUtc === "string" &&
      "lost" in parsed &&
      typeof (parsed as DailyPlayCache).lost === "boolean"
    ) {
      return parsed as DailyPlayCache;
    }
  } catch {
    /* ignore corrupt cache */
  }
  return null;
}

/** True when this browser already finished a run today (lost and saved). */
export function hasFinishedToday(email?: string | null): boolean {
  const cache = readCache();
  if (!cache) return false;
  if (cache.playDateUtc !== todayUtcDate() || !cache.lost) return false;
  if (email && cache.email && cache.email !== normalizeEmail(email)) {
    return false;
  }
  return true;
}

/** Call after a successful save when the player lost. */
export function markLostToday(email?: string | null): void {
  if (typeof window === "undefined") return;
  const entry: DailyPlayCache = {
    playDateUtc: todayUtcDate(),
    lost: true,
    ...(email ? { email: normalizeEmail(email) } : {}),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}
