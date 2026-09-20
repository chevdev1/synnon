import { getSessionUser } from "@/server/auth";
import { rateLimit } from "@/server/guards";
import { fail, json, readJson } from "@/server/http";
import { submitAnswer } from "@/server/question";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "sign in first");
  const rl = rateLimit(`answer:${user.id}`, 4, 60_000);
  if (!rl.ok) return fail(429, "slow down a little", { retryAfterSec: rl.retryAfterSec });
  const body = await readJson(req);
  const r = await submitAnswer(user.id, body?.text);
  if (!r.ok) return fail(r.code, r.error);
  // 202: saved, but it only shows up after moderation
  return json({ status: r.status }, r.status === "approved" ? 201 : 202);
}
