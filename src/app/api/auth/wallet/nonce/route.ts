import { createWalletChallenge } from "@/server/auth";
import { rateLimit } from "@/server/guards";
import { fail, json, readJson } from "@/server/http";
import { isChain, normalizeAddress } from "@/server/wallet";

export async function POST(req: Request) {
  const body = await readJson(req);
  if (!isChain(body?.chain)) return fail(400, "chain must be evm or sol");
  const address = normalizeAddress(body.chain, body.address);
  if (!address) return fail(400, "that doesn't look like a valid wallet address");

  const rl = rateLimit(`wallet-nonce:${address}`, 8, 10 * 60_000);
  if (!rl.ok) return fail(429, "too many attempts, try again in a bit", { retryAfterSec: rl.retryAfterSec });

  const { nonce, message } = await createWalletChallenge(body.chain, address, new URL(req.url).origin);
  return json({ nonce, message, address });
}
