// The mind's mood is not random: it is derived from what is really going on
// (see server/mood.ts) and sampled over time, so a week of it can be charted.
export const MOOD_LIST = ["curious", "watching", "listening", "wondering", "restless"] as const;
export type MoodId = (typeof MOOD_LIST)[number];
export const MOOD_COLOR: Record<MoodId, string> = { curious: "#c4f260", watching: "#7fd6ff", listening: "#ff9be0", wondering: "#b9a6f5", restless: "#ff8a4c" };
export const MOOD_NAME: Record<MoodId, { en: string; ru: string }> = {
  curious: { en: "curious", ru: "любопытный" },
  watching: { en: "watching", ru: "наблюдает" },
  listening: { en: "listening", ru: "слушает" },
  wondering: { en: "wondering", ru: "размышляет" },
  restless: { en: "restless", ru: "беспокойный" },
};

export interface MoodDay {
  day: string; // YYYY-MM-DD (UTC)
  counts: Partial<Record<MoodId, number>>;
}
export interface MoodWeek {
  days: MoodDay[]; // 7 days, oldest first
  dominant: MoodId | null;
  source: "live" | "demo";
}

export function dominantMood(days: MoodDay[]): MoodId | null {
  const total: Record<string, number> = {};
  for (const d of days) for (const [m, n] of Object.entries(d.counts)) total[m] = (total[m] ?? 0) + (n ?? 0);
  const best = Object.entries(total).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? (best[0] as MoodId) : null;
}

const dayStr = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const lastSevenDays = (now = Date.now()) => Array.from({ length: 7 }, (_, i) => dayStr(now - (6 - i) * 86_400_000));

// Deterministic simulated week for the demo (labelled as simulated in the interface).
export function demoMoodWeek(now: number): MoodWeek {
  const days = lastSevenDays(now).map((day, i) => {
    const h = (i * 2654435761) >>> 0;
    const counts: Partial<Record<MoodId, number>> = {};
    MOOD_LIST.forEach((m, k) => {
      const v = ((h >>> (k * 3)) & 7) + (k === i % 5 ? 6 : 1);
      counts[m] = v;
    });
    return { day, counts };
  });
  return { days, dominant: dominantMood(days), source: "demo" };
}
