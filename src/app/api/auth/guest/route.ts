import { cleanNickname, createGuest, setSessionCookie } from "@/server/auth";
import { rateLimit } from "@/server/guards";
import { fail, json, readJson } from "@/server/http";

export async function POST(req: Request) {
  const body = await readJson(req);
  const name = cleanNickname(body?.name);
  if (!name) return fail(400, "nickname: 2-20 letters, digits, _ or -");

  // Coarse global cap so the endpoint can't be used to mint accounts in bulk.
  const rl = rateLimit("guest-signup", 30, 60 * 60_000);
  if (!rl.ok) return fail(429, "too many new visitors right now, try again soon", { retryAfterSec: rl.retryAfterSec });

  const { user, raw } = await createGuest(name);
  await setSessionCookie(raw);
  return json({ user: { id: user.id, username: user.username } }, 201);
}
