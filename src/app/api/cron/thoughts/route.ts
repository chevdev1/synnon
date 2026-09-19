import { fail, json } from "@/server/http";
import { rateLimit } from "@/server/guards";
import { generateAutonomousThought } from "@/server/service";

// Hit this from a real scheduler (cron / Vercel cron) every 1-3 hours.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return fail(401, "unauthorized");
  // Section 11.2: cap the cadence even if the scheduler misfires.
  const rl = rateLimit("cron:thoughts", 1, 30 * 60_000);
  if (!rl.ok) return fail(429, "too soon", { retryAfterSec: rl.retryAfterSec });
  try {
    const t = await generateAutonomousThought();
    return t ? json({ thought: { id: t.id, text: t.text } }) : json({ thought: null, reason: "llm unavailable or nothing to think about" }, 503);
  } catch (e) {
    console.error("[thoughts]", e);
    return fail(502, "generation failed");
  }
}
