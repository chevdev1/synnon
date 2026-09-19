"use client";

import { toFunctionSelector } from "viem";

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

// ---- Robinhood Chain + test-token helpers (EVM wallets only) ----

export interface ChainInfo {
  id: number;
  name: string;
  rpc: string;
  explorer: string;
  currency: { name: string; symbol: string; decimals: number };
}
export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

const hexId = (id: number) => "0x" + id.toString(16);
type Result = { ok: true } | { ok: false; error: string };

export async function switchToChain(chain: ChainInfo): Promise<Result> {
  const eth = window.ethereum;
  if (!eth) return { ok: false, error: "No EVM wallet found." };
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId(chain.id) }] });
    return { ok: true };
  } catch (e) {
    const code = (e as { code?: number }).code;
    if (code !== 4902 && code !== -32603) return { ok: false, error: friendly(e) };
  }
  try {
    // 4902 = the wallet doesn't know this chain yet: add it (this also switches).
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexId(chain.id),
          chainName: chain.name,
          nativeCurrency: chain.currency,
          rpcUrls: [chain.rpc],
          blockExplorerUrls: [chain.explorer],
        },
      ],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

export async function addTokenToWallet(token: TokenInfo): Promise<Result> {
  const eth = window.ethereum;
  if (!eth) return { ok: false, error: "No EVM wallet found." };
  try {
    await eth.request({
      method: "wallet_watchAsset",
      params: [{ type: "ERC20", options: { address: token.address, symbol: token.symbol, decimals: token.decimals } }] as unknown[],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}

// Calls faucet() on the test token, then waits for the transaction to be mined.
export async function requestTestTokens(chain: ChainInfo, token: TokenInfo, onSent?: () => void): Promise<Result> {
  const eth = window.ethereum;
  if (!eth) return { ok: false, error: "No EVM wallet found." };
  const switched = await switchToChain(chain);
  if (!switched.ok) return switched;
  try {
    const [from] = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    const hash = (await eth.request({
      method: "eth_sendTransaction",
      params: [{ from, to: token.address, data: toFunctionSelector("faucet()") }],
    })) as string;
    onSent?.();
    for (let i = 0; i < 60; i++) {
      const receipt = (await eth.request({ method: "eth_getTransactionReceipt", params: [hash] })) as { status?: string } | null;
      if (receipt) return receipt.status === "0x1" ? { ok: true } : { ok: false, error: "The faucet transaction failed (the faucet allows one claim per 24 hours per wallet)." };
      await new Promise((r) => setTimeout(r, 2000));
    }
    return { ok: false, error: "Still waiting for the network. Check your wallet, then reopen this window." };
  } catch (e) {
    return { ok: false, error: friendly(e) };
  }
}
