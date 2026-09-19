"use client";

// Browser side of wallet sign-in. Talks to injected providers directly
// (EIP-1193 for EVM wallets such as MetaMask, Phantom's API for Solana), so
// there is no wallet SDK to ship. The wallet only ever signs a login message.

export type Chain = "evm" | "sol";

interface EthProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}
interface SolProvider {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  signMessage(msg: Uint8Array, display?: string): Promise<{ signature: Uint8Array }>;
}

declare global {
  interface Window {
    ethereum?: EthProvider;
    solana?: SolProvider;
    phantom?: { solana?: SolProvider };
  }
}

const sol = (): SolProvider | undefined => window.phantom?.solana ?? (window.solana?.isPhantom ? window.solana : undefined);

export function walletAvailable(chain: Chain): boolean {
  return chain === "evm" ? !!window.ethereum : !!sol();
}

const toHex = (s: string) =>
  "0x" + Array.from(new TextEncoder().encode(s), (b) => b.toString(16).padStart(2, "0")).join("");
const toBase64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let data: Record<string, unknown> = {};
  try {
    data = (await r.json()) as Record<string, unknown>;
  } catch {
    /* empty */
  }
  return { ok: r.ok, data };
}

function friendly(e: unknown): string {
  const err = e as { code?: number | string; message?: string };
  if (err?.code === 4001 || err?.code === "ACTION_REJECTED" || /reject|denied|cancel/i.test(err?.message ?? "")) {
    return "You closed the wallet prompt. Nothing was signed.";
  }
  if (err?.code === -32002) return "The wallet already has a pending request. Open it and finish or cancel it.";
  return err?.message ? `Wallet error: ${err.message}` : "Something went wrong with the wallet.";
}

export async function walletSignIn(chain: Chain): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    let address: string;
    let sign: (message: string) => Promise<string>;

    if (chain === "evm") {
      const eth = window.ethereum;
      if (!eth) return { ok: false, error: "No EVM wallet found. Install MetaMask (or another browser wallet) and reload." };
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.[0]) return { ok: false, error: "The wallet didn't share an account." };
      address = accounts[0];
      sign = async (message) => (await eth.request({ method: "personal_sign", params: [toHex(message), address] })) as string;
    } else {
      const p = sol();
      if (!p) return { ok: false, error: "No Solana wallet found. Install Phantom and reload." };
      address = (await p.connect()).publicKey.toString();
      sign = async (message) => toBase64((await p.signMessage(new TextEncoder().encode(message), "utf8")).signature);
    }

    const ch = await post("/api/auth/wallet/nonce", { chain, address });
    if (!ch.ok) return { ok: false, error: String(ch.data.error ?? "could not start sign-in") };
    const signature = await sign(String(ch.data.message));
    const v = await post("/api/auth/wallet/verify", { nonce: ch.data.nonce, signature });
    return v.ok ? { ok: true } : { ok: false, error: String(v.data.error ?? "sign-in failed") };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}
