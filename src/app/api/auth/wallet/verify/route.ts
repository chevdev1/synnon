import { completeWalletLogin, getSessionUser, setSessionCookie } from "@/server/auth";
import { fail, json, readJson } from "@/server/http";
import { shortAddress } from "@/server/wallet";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (typeof body?.nonce !== "string" || typeof body.signature !== "string" || body.signature.length > 400) {
    return fail(400, "nonce and signature are required");
  }
  const current = await getSessionUser();
  const r = await completeWalletLogin(body.nonce, body.signature, current?.id ?? null);
  if (!r.ok) return fail(401, r.error);
  if (r.raw) await setSessionCookie(r.raw);
  return json({
    user: { id: r.user.id, username: r.user.username, wallet: r.user.walletAddress ? shortAddress(r.user.walletAddress) : null },
    linked: r.linked,
  });
}
