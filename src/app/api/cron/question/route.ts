import { fail, json } from "@/server/http";
import { ensureQuestion } from "@/server/question";

// Optional: call once a week (Monday) so the first visitor doesn't wait for the mind to think of it.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return fail(401, "unauthorized");
  try {
    const q = await ensureQuestion();
    return json({ week: q.week, text: q.text, source: q.source });
  } catch (e) {
    console.error("[cron/question]", e);
    return fail(502, "failed");
  }
}
