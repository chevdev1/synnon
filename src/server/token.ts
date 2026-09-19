import { createPublicClient, defineChain, formatUnits, http, parseUnits } from "viem";
import { CHAIN, TOKEN, gatingEnabled } from "@/lib/chain";

// Token gating ("hold" model): a wallet must hold >= TOKEN.minHold tokens when
// it claims a node. The check reads balanceOf on-chain, using only the standard
// ERC-20 interface, so the test token and the real launchpad token are
// interchangeable (just change NEXT_PUBLIC_SYNOD_TOKEN_ADDRESS).

const erc20 = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const chain = defineChain({
  id: CHAIN.id,
  name: CHAIN.name,
  nativeCurrency: CHAIN.currency,
  rpcUrls: { default: { http: [CHAIN.rpc] } },
});
const client = createPublicClient({ chain, transport: http(CHAIN.rpc, { timeout: 8_000, retryCount: 1 }) });

export const evmAddressOf = (walletKey: string | null | undefined): `0x${string}` | null =>
  walletKey?.startsWith("evm:") ? (walletKey.slice(4) as `0x${string}`) : null;

export async function readBalance(address: `0x${string}`): Promise<bigint> {
  if (!TOKEN.address) return BigInt(0);
  return client.readContract({ address: TOKEN.address, abi: erc20, functionName: "balanceOf", args: [address] });
}

export const whole = (raw: bigint) => formatUnits(raw, TOKEN.decimals);

export type Eligibility =
  | { ok: true }
  | { ok: false; code: 403 | 503; error: string; balance?: string };

const need = () => `${TOKEN.minHold} ${TOKEN.symbol}`;

export async function checkClaimEligibility(walletKey: string | null | undefined): Promise<Eligibility> {
  if (!gatingEnabled) return { ok: true };
  const addr = evmAddressOf(walletKey);
  if (!addr) {
    return { ok: false, code: 403, error: `Claiming needs an EVM wallet holding ${need()} on ${CHAIN.name}. Connect one first.` };
  }
  try {
    const raw = await readBalance(addr);
    if (raw >= parseUnits(String(TOKEN.minHold), TOKEN.decimals)) return { ok: true };
    const bal = whole(raw);
    return {
      ok: false,
      code: 403,
      balance: bal,
      error: `Your wallet holds ${bal} ${TOKEN.symbol}; claiming needs ${need()}.${TOKEN.faucet ? " Use “Get test tokens”." : ""}`,
    };
  } catch (e) {
    console.error("[token] balance read failed", e);
    return { ok: false, code: 503, error: `Couldn't read ${CHAIN.name} right now. Try again in a moment.` };
  }
}
