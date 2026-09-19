import { fail, json } from "@/server/http";
import { rateLimit } from "@/server/guards";
import { generateDiaryEntry } from "@/server/diary";

// Call once a day from a scheduler (e.g. 23:55 UTC) to write that day's entry.
// Optional ?day=YYYY-MM-DD backfills a past day. Already-written days are left alone.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return fail(401, "unauthorized");
  const rl = rateLimit("cron:diary", 3, 10 * 60_000);
  if (!rl.ok) return fail(429, "too soon", { retryAfterSec: rl.retryAfterSec });
  const day = new URL(req.url).searchParams.get("day") ?? undefined;
  try {
    const r = await generateDiaryEntry(day);
    if (r.ok) return json({ entry: r.entry, created: r.created });
    const status = r.reason === "bad_day" || r.reason === "future" ? 400 : r.reason === "quiet" ? 200 : r.reason === "llm_unavailable" ? 503 : 502;
    return json({ entry: null, reason: r.reason }, status);
  } catch (e) {
    console.error("[diary]", e);
    return fail(502, "generation failed");
  }
}
