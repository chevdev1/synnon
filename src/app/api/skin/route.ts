import { getSessionUser } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { getSkinInfo, setSkin } from "@/server/skin";
import { rateLimit } from "@/server/guards";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail(401, "sign in first");
  const info = await getSkinInfo(user.id);
  return info ? json(info) : fail(404, "you don't hold a cell yet");
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "sign in first");
  const rl = rateLimit(`skin:${user.id}`, 20, 60_000);
  if (!rl.ok) return fail(429, "too fast", { retryAfterSec: rl.retryAfterSec });
  const body = await readJson(req);
  const skin = body && "skin" in body ? (body.skin === null ? null : String(body.skin)) : undefined;
  if (skin === undefined) return fail(400, "skin required");
  const r = await setSkin(user.id, skin);
  return r.ok ? json(r.info) : fail(r.code, r.error);
}
