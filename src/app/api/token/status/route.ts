import { getSessionUser } from "@/server/auth";
import { json } from "@/server/http";
import { evmAddressOf, readBalance, whole } from "@/server/token";
import { CHAIN, TOKEN, gatingEnabled } from "@/lib/chain";

// Public token/chain config plus, for a signed-in EVM wallet, its live balance.
export async function GET() {
  const base = {
    enabled: gatingEnabled,
    chain: { id: CHAIN.id, name: CHAIN.name, rpc: CHAIN.rpc, explorer: CHAIN.explorer, currency: CHAIN.currency, faucet: CHAIN.faucet ?? null },
    token: { address: TOKEN.address, symbol: TOKEN.symbol, decimals: TOKEN.decimals, minHold: TOKEN.minHold, faucet: TOKEN.faucet },
  };
  if (!gatingEnabled) return json({ ...base, wallet: null });

  const user = await getSessionUser();
  const addr = evmAddressOf(user?.walletAddress);
  if (!addr) return json({ ...base, wallet: null });
  try {
    const raw = await readBalance(addr);
    const balance = whole(raw);
    return json({ ...base, wallet: { address: addr, balance, eligible: Number(balance) >= TOKEN.minHold } });
  } catch {
    return json({ ...base, wallet: { address: addr, balance: null, eligible: false, error: "couldn't read the chain" } });
  }
}
