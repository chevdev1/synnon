"use client";

import { synodTestBytecode } from "@/lib/synodTestArtifact";
import { switchToChain, type ChainInfo } from "@/lib/wallet";

// One-click deploy of the tSYNOD test token from the visitor's own wallet.
// Hard safety rule: this only ever runs on Robinhood Chain *testnet* (46630).

const TESTNET_ID = 46630;
type Provider = { request(a: { method: string; params?: unknown[] }): Promise<unknown> };
const eth = () => (window as unknown as { ethereum?: Provider }).ethereum;

export type DeployResult =
  | { ok: true; address: string; hash: string }
  | { ok: false; error: string };

export async function deployTestToken(chain: ChainInfo, phase: (s: string) => void): Promise<DeployResult> {
  const p = eth();
  if (!p) return { ok: false, error: "No browser wallet found. Install MetaMask and reload." };
  if (chain.id !== TESTNET_ID) return { ok: false, error: "Deploy is locked to the testnet for safety." };

  try {
    phase("Connecting wallet…");
    const [from] = (await p.request({ method: "eth_requestAccounts" })) as string[];
    if (!from) return { ok: false, error: "The wallet didn't share an account." };

    phase("Switching your wallet to Robinhood Chain Testnet…");
    const sw = await switchToChain(chain);
    if (!sw.ok) return sw;

    const chainId = parseInt((await p.request({ method: "eth_chainId" })) as string, 16);
    if (chainId !== TESTNET_ID) {
      return { ok: false, error: `Your wallet is on chain ${chainId}, not the testnet (${TESTNET_ID}). Nothing was sent.` };
    }

    const balance = BigInt((await p.request({ method: "eth_getBalance", params: [from, "latest"] })) as string);
    if (balance === BigInt(0)) {
      return { ok: false, error: "This wallet has 0 test ETH on the testnet, so it can't pay the (tiny) fee. Get test ETH from the faucet first." };
    }

    phase("Confirm the deployment in your wallet…");
    const hash = (await p.request({ method: "eth_sendTransaction", params: [{ from, data: synodTestBytecode }] })) as string;

    phase("Waiting for the network to include it…");
    for (let i = 0; i < 60; i++) {
      const r = (await p.request({ method: "eth_getTransactionReceipt", params: [hash] })) as { status?: string; contractAddress?: string } | null;
      if (r) {
        if (r.status !== "0x1" || !r.contractAddress) return { ok: false, error: "The deployment transaction failed." };
        return { ok: true, address: r.contractAddress.toLowerCase(), hash };
      }
      await new Promise((res) => setTimeout(res, 2000));
    }
    return { ok: false, error: `Still pending. Check the transaction ${hash} on the explorer.` };
  } catch (e) {
    const err = e as { code?: number; message?: string };
    if (err.code === 4001 || /reject|denied/i.test(err.message ?? "")) return { ok: false, error: "You closed the wallet prompt. Nothing was sent." };
    return { ok: false, error: err.message ?? "Something went wrong." };
  }
}
