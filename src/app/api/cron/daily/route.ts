import { fail, json } from "@/server/http";
import { generateDiaryEntry } from "@/server/diary";
import { ensureQuestion } from "@/server/question";
import { generateAutonomousThought } from "@/server/service";

// One daily job for the free Vercel plan (two cron jobs at most, once a day each):
// yesterday's diary entry, this week's question and one thought.
// The site also does all three lazily when somebody visits, so this is a safety net.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return fail(401, "unauthorized");
  const out: Record<string, unknown> = {};
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  try {
    const d = await generateDiaryEntry(yesterday);
    out.diary = d.ok ? { day: d.entry.day, created: d.created } : d.reason;
  } catch (e) {
    out.diary = "error: " + (e as Error).message;
  }
  try {
    out.question = (await ensureQuestion()).week;
  } catch (e) {
    out.question = "error: " + (e as Error).message;
  }
  try {
    const t = await generateAutonomousThought();
    out.thought = t ? t.id : null;
  } catch (e) {
    out.thought = "error: " + (e as Error).message;
  }
  return json(out);
}
export const POST = GET;
