"use client";

import { useState } from "react";
import { CHAIN, explorerAddress, explorerTx } from "@/lib/chain";
import { deployTestToken } from "@/lib/deployToken";
import { addTokenToWallet } from "@/lib/wallet";

export default function DeployPage() {
  const [phase, setPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ address: string; hash: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const busy = phase !== null && !done && !error;
  const isTestnet = CHAIN.id === 46630;

  async function go() {
    setError(null);
    setDone(null);
    const r = await deployTestToken(CHAIN, setPhase);
    if (r.ok) setDone({ address: r.address, hash: r.hash });
    else setError(r.error);
    setPhase(null);
  }

  const env = done
    ? `NEXT_PUBLIC_SYNOD_TOKEN_ADDRESS=${done.address}\nNEXT_PUBLIC_SYNOD_TOKEN_SYMBOL=tSYNOD\nNEXT_PUBLIC_SYNOD_MIN_HOLD=100\nNEXT_PUBLIC_SYNOD_TOKEN_FAUCET=1`
    : "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-5 py-10">
      <h1 className="font-head text-[14px] uppercase text-[var(--text)]">Deploy the test token</h1>
      <p className="text-[18px] leading-snug text-[var(--text-2)]">
        Creates <span className="text-[var(--lime)]">tSYNOD</span> from your own wallet on <span className="text-[var(--text)]">{CHAIN.name}</span>. It is a{" "}
        <span className="text-[var(--lime)]">test network: no real money</span> is involved. The page switches your wallet to the test network for you and refuses to run on any other network.
      </p>

      {!isTestnet ? (
        <p className="text-[#ff8a6c]">This build is configured for the mainnet, so deploying the test token is disabled.</p>
      ) : (
        <button
          type="button"
          onClick={go}
          disabled={busy}
          className="pixel-btn font-head h-12 border-2 border-[var(--lime)] bg-[var(--lime)]/10 px-5 text-[10px] uppercase text-[var(--lime)] disabled:opacity-60"
        >
          {busy ? "Working…" : "Connect wallet & deploy"}
        </button>
      )}

      {phase && <p className="text-[18px] text-[#ffd166]">{phase}</p>}
      {error && <p className="text-[18px] leading-snug text-[#ff8a6c]">{error}</p>}
      {error && CHAIN.faucet && (
        <a className="text-[17px] text-[var(--link)] underline" href={CHAIN.faucet} target="_blank" rel="noreferrer">
          Testnet ETH faucet
        </a>
      )}

      {done && (
        <div className="space-y-3 border-2 border-[var(--lime)] bg-[#0b0a1f] p-4">
          <div className="font-head text-[9px] uppercase text-[var(--lime)]">Deployed</div>
          <p className="break-all text-[18px] text-[var(--text)]">{done.address}</p>
          <p className="text-[16px] text-[var(--muted)]">
            <a className="text-[var(--link)] underline" href={explorerAddress(done.address)} target="_blank" rel="noreferrer">
              contract
            </a>{" "}
            ·{" "}
            <a className="text-[var(--link)] underline" href={explorerTx(done.hash)} target="_blank" rel="noreferrer">
              transaction
            </a>
          </p>
          <pre className="overflow-x-auto bg-black/40 p-2 text-[15px] text-[var(--text-2)]">{env}</pre>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="pixel-btn font-head h-9 border-2 border-[var(--accent)] px-3 text-[8px] uppercase text-[var(--link)]"
              onClick={() => {
                void navigator.clipboard.writeText(done.address).then(() => setCopied(true));
              }}
            >
              {copied ? "Copied" : "Copy address"}
            </button>
            <button
              type="button"
              className="pixel-btn font-head h-9 border-2 border-[var(--accent)] px-3 text-[8px] uppercase text-[var(--link)]"
              onClick={() => void addTokenToWallet({ address: done.address, symbol: "tSYNOD", decimals: 18 })}
            >
              Show in wallet
            </button>
          </div>
          <p className="text-[16px] text-[var(--text-2)]">Send this address to whoever is setting up the site. That is the only thing left.</p>
        </div>
      )}
    </main>
  );
}
