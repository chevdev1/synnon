"use client";

import { useEffect, useState } from "react";
import { useLive } from "@/lib/live/context";
import { useDemo } from "@/lib/demo";
import { addTokenToWallet, requestTestTokens, switchToChain, walletAvailable, type Chain, type ChainInfo, type TokenInfo } from "@/lib/wallet";

const EVENT = "synnod:open-claim";
export const openClaim = () => window.dispatchEvent(new Event(EVENT));

const inputCls =
  "h-10 w-full min-w-0 rounded-[3px] border-2 border-[var(--border)] bg-transparent px-3 text-[17px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--lime)]";
const btnCls =
  "pixel-btn font-head flex h-10 shrink-0 items-center justify-center border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 text-[9px] uppercase text-[var(--text)] disabled:opacity-50";
const miniBtn =
  "pixel-btn font-head flex h-8 items-center justify-center border-2 border-[var(--accent)] px-2.5 text-[8px] uppercase text-[var(--link)] disabled:opacity-50";

const STATUS_TEXT: Record<string, string> = {
  available: "free — nobody's voice yet",
  claimed: "claimed, waiting for its first words",
  active: "speaking right now",
  memory: "holds a memory",
  featured: "featured by the mind",
};

interface TokenStatus {
  enabled: boolean;
  chain: ChainInfo & { faucet: string | null };
  token: { address: string | null; symbol: string; decimals: number; minHold: number; faucet: boolean };
  wallet: { address: string; balance: string | null; eligible: boolean } | null;
}

function WalletButton({ chain, name, sub, busy, onPick }: { chain: Chain; name: string; sub: string; busy: boolean; onPick: (c: Chain) => void }) {
  const found = walletAvailable(chain);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => onPick(chain)}
      className="pixel-btn flex w-full items-center justify-between gap-3 border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2 text-left disabled:opacity-50"
    >
      <span>
        <span className="font-head block text-[9px] uppercase text-[var(--text)]">{name}</span>
        <span className="text-[15px] text-[var(--muted)]">{sub}</span>
      </span>
      <span className={`font-head text-[7px] uppercase ${found ? "text-[var(--lime)]" : "text-[#ff8a6c]"}`}>{found ? "detected" : "not found"}</span>
    </button>
  );
}

function TokenPanel({
  tok,
  hasEvmWallet,
  onChanged,
  setMsg,
}: {
  tok: TokenStatus;
  hasEvmWallet: boolean;
  onChanged: () => void;
  setMsg: (m: string | null) => void;
}) {
  const [working, setWorking] = useState<null | "chain" | "faucet" | "token">(null);
  const [phase, setPhase] = useState<string | null>(null);
  const sym = tok.token.symbol;
  const chainInfo: ChainInfo = tok.chain;
  const tokenInfo: TokenInfo | null = tok.token.address ? { address: tok.token.address, symbol: sym, decimals: tok.token.decimals } : null;
  const w = tok.wallet;

  async function run(kind: "chain" | "faucet" | "token") {
    setWorking(kind);
    setMsg(null);
    setPhase(null);
    let r;
    if (kind === "chain") r = await switchToChain(chainInfo);
    else if (kind === "token" && tokenInfo) r = await addTokenToWallet(tokenInfo);
    else if (tokenInfo) {
      setPhase("Confirm in your wallet…");
      r = await requestTestTokens(chainInfo, tokenInfo, () => setPhase("Waiting for the network…"));
    } else r = { ok: false as const, error: "No token configured." };
    setWorking(null);
    setPhase(null);
    if (!r.ok) setMsg(r.error);
    else onChanged();
  }

  return (
    <div className="space-y-2 border-2 border-[var(--border)] bg-[#0b0a1f] p-3">
      <div className="font-head text-[8px] uppercase text-[var(--lime)]">Token requirement</div>
      <p className="text-[16px] leading-snug text-[var(--text-2)]">
        To claim a cell, hold at least{" "}
        <span className="text-[var(--text)]">
          {tok.token.minHold} {sym}
        </span>{" "}
        on <span className="text-[var(--text)]">{tok.chain.name}</span>.
      </p>
      {w && (
        <p className="text-[16px] text-[var(--text-2)]">
          Your balance:{" "}
          <span className={w.eligible ? "text-[var(--lime)]" : "text-[#ff8a6c]"}>
            {w.balance ?? "?"} {sym} {w.eligible ? "✓" : "✗"}
          </span>
        </p>
      )}
      {hasEvmWallet && (
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" disabled={working !== null} onClick={() => run("chain")} className={miniBtn}>
            {working === "chain" ? "…" : "Add network"}
          </button>
          {tok.token.faucet && (
            <button type="button" disabled={working !== null} onClick={() => run("faucet")} className={miniBtn}>
              {working === "faucet" ? "…" : `Get test ${sym}`}
            </button>
          )}
          <button type="button" disabled={working !== null} onClick={() => run("token")} className={miniBtn}>
            {working === "token" ? "…" : "Show in wallet"}
          </button>
        </div>
      )}
      {phase && <p className="text-[15px] text-[#ffd166]">{phase}</p>}
      <p className="text-[14px] leading-snug text-[var(--muted)]">
        Test tokens are free.{" "}
        {tok.chain.faucet && (
          <>
            You also need a little test ETH for gas:{" "}
            <a href={tok.chain.faucet} target="_blank" rel="noreferrer" className="text-[var(--link)] underline hover:text-[var(--lime)]">
              ETH faucet
            </a>
            .{" "}
          </>
        )}
        {tok.token.address && (
          <a href={`${tok.chain.explorer}/address/${tok.token.address}`} target="_blank" rel="noreferrer" className="text-[var(--link)] underline hover:text-[var(--lime)]">
            token contract
          </a>
        )}
      </p>
    </div>
  );
}

export default function ClaimDialog() {
  const demoSwitch = useDemo();
  const { mode, offline, me, nodes, selectedId, signIn, signInWithWallet, claim, logout } = useLive();
  const [open, setOpen] = useState(false);
  const [nick, setNick] = useState("");
  const [guest, setGuest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tok, setTok] = useState<TokenStatus | null>(null);
  const [tokTick, setTokTick] = useState(0);

  useEffect(() => {
    const on = () => {
      setMsg(null);
      setOpen(true);
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Token status (config + this wallet's live balance). Refetched on open, on
  // sign-in changes, and whenever a child action bumps tokTick.
  const walletKey = me?.wallet ?? me?.name ?? "";
  useEffect(() => {
    if (!open || mode !== "api" || offline) return;
    let cancelled = false;
    const t = setTimeout(() => {
      void fetch("/api/token/status", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<TokenStatus>) : null))
        .then((d) => !cancelled && d && setTok(d))
        .catch(() => {});
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, mode, offline, walletKey, tokTick]);

  if (!open) return null;

  const gated = mode === "api" && !!tok?.enabled;
  const eligible = !gated || !!tok?.wallet?.eligible;
  const target = selectedId != null ? nodes.find((n) => n.id === selectedId) : undefined;
  const canClaim = target?.status === "available";
  const nodeLabel = target ? `Node ${String(target.id).padStart(2, "0")}` : null;

  async function pickWallet(chain: Chain) {
    setBusy(true);
    setMsg(null);
    const r = await signInWithWallet(chain);
    setBusy(false);
    if (!r.ok) setMsg(r.error);
  }

  async function submitNick(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await signIn(nick.trim());
    setBusy(false);
    if (!r.ok) setMsg(r.error);
  }

  async function doClaim() {
    if (!target) return;
    setBusy(true);
    setMsg(null);
    const r = await claim(target.id);
    setBusy(false);
    if (r.ok) setOpen(false);
    else {
      setMsg(r.error);
      setTokTick((n) => n + 1);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Claim a node"
    >
      <div className="fade-in-up my-auto w-full max-w-md rounded-[3px] border-2 border-[var(--accent)] bg-[var(--panel)] p-5 shadow-[6px_6px_0_rgba(108,95,214,0.5)]">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-head text-[11px] uppercase text-[var(--text)]">{nodeLabel ?? "Claim a node"}</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="font-head text-[10px] text-[var(--muted)] hover:text-[var(--lime)]">
            ✕
          </button>
        </div>
        {target && (
          <p className="mt-2 text-[16px] leading-snug text-[var(--muted)]">
            {STATUS_TEXT[target.status] ?? target.status}
            {target.ownerName ? <span className="text-[var(--text-2)]"> · voice: {target.ownerName}</span> : null}
          </p>
        )}

        {mode === "demo" ? (
          <div className="mt-4 space-y-3">
            <p className="text-[17px] leading-snug text-[var(--text-2)]">
              You are in the simulated demo, where everything moves by itself and nothing is saved. Wallet sign-in and claiming a cell work in{" "}
              <span className="text-[var(--lime)]">Live data</span> mode.
            </p>
            <button
              type="button"
              onClick={() => {
                demoSwitch.toggle();
                // switching remounts the live provider (and this dialog); reopen once it is back
                window.setTimeout(openClaim, 250);
              }}
              className={btnCls}
            >
              Switch to Live data →
            </button>
          </div>
        ) : offline ? (
          <p className="mt-4 text-[17px] leading-snug text-[var(--text-2)]">
            The live backend isn&apos;t connected on this deployment (no database yet), so sign-in and claiming are unavailable here. Use the{" "}
            <span className="text-[#ffd166]">Demo data</span> toggle in the header to explore, or run the project locally.
          </p>
        ) : !me ? (
          <div className="mt-4 space-y-3">
            <p className="text-[17px] leading-snug text-[var(--text-2)]">
              {target && !canClaim ? "Connect to look around and claim a free cell of your own." : "Connect a wallet to claim this cell. You only sign a message — no transaction, no fee."}
            </p>
            {gated && tok && <TokenPanel tok={tok} hasEvmWallet={false} onChanged={() => setTokTick((n) => n + 1)} setMsg={setMsg} />}
            <WalletButton chain="evm" name="Browser wallet" sub={gated ? `MetaMask, Rabby, Coinbase… on ${tok?.chain.name}` : "MetaMask & other EVM wallets"} busy={busy} onPick={pickWallet} />
            {!gated && <WalletButton chain="sol" name="Phantom" sub="Solana" busy={busy} onPick={pickWallet} />}
            {!gated &&
              (!guest ? (
                <button type="button" onClick={() => setGuest(true)} className="font-head pt-1 text-[8px] uppercase text-[var(--muted)] transition-colors hover:text-[var(--text)]">
                  or continue with just a nickname
                </button>
              ) : (
                <form onSubmit={submitNick} className="space-y-2 border-t-2 border-[var(--divider)] pt-3">
                  <p className="text-[16px] leading-snug text-[var(--muted)]">A nickname stays in this browser only. You can link a wallet later to keep your node.</p>
                  <input
                    autoFocus
                    required
                    minLength={2}
                    maxLength={20}
                    pattern="[\p{L}\p{N}_\-]{2,20}"
                    title="2-20 letters, digits, _ or -"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    placeholder="nickname"
                    className={inputCls}
                  />
                  <button type="submit" disabled={busy} className={btnCls}>
                    {busy ? "Entering…" : "Enter →"}
                  </button>
                </form>
              ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-[17px] text-[var(--text-2)]">
            <p>
              Signed in as <span className="text-[var(--lime)]">{me.name}</span>
              {me.wallet && me.wallet !== me.name ? <span className="text-[var(--muted)]"> ({me.wallet})</span> : null}.
            </p>
            {me.nodeId ? (
              <p>
                You hold <span className="text-[var(--lime)]">node {String(me.nodeId).padStart(2, "0")}</span>.
              </p>
            ) : (
              <>
                {gated && tok && <TokenPanel tok={tok} hasEvmWallet={!!tok.wallet} onChanged={() => setTokTick((n) => n + 1)} setMsg={setMsg} />}
                {target ? (
                  canClaim ? (
                    <button type="button" disabled={busy || !eligible} onClick={doClaim} className={btnCls}>
                      {busy ? "Claiming…" : eligible ? `Claim ${nodeLabel} →` : `Need ${tok?.token.minHold} ${tok?.token.symbol} to claim`}
                    </button>
                  ) : (
                    <p className="text-[#ff8a6c]">That cell is already taken. Pick a free one on the brain.</p>
                  )
                ) : (
                  <p>Click a cell on the brain to choose which node to claim.</p>
                )}
              </>
            )}
            {!me.wallet && !gated && (
              <div className="space-y-2 border-t-2 border-[var(--divider)] pt-3">
                <p className="text-[16px] leading-snug text-[var(--muted)]">Link a wallet so this node survives clearing your browser.</p>
                <WalletButton chain="evm" name="Link MetaMask / EVM" sub="Ethereum-compatible" busy={busy} onPick={pickWallet} />
                <WalletButton chain="sol" name="Link Phantom" sub="Solana" busy={busy} onPick={pickWallet} />
              </div>
            )}
            {gated && !tok?.wallet && (
              <div className="space-y-2 border-t-2 border-[var(--divider)] pt-3">
                <p className="text-[16px] leading-snug text-[var(--muted)]">Claiming needs an EVM wallet. Connect one to continue.</p>
                <WalletButton chain="evm" name="Connect EVM wallet" sub={tok?.chain.name ?? ""} busy={busy} onPick={pickWallet} />
              </div>
            )}
            <button type="button" onClick={() => void logout().then(() => setOpen(false))} className="font-head text-[8px] uppercase text-[var(--muted)] transition-colors hover:text-[#ff8a6c]">
              Sign out
            </button>
          </div>
        )}

        {msg && <div className="mt-4 text-[16px] leading-snug text-[#ff8a6c]">{msg}</div>}
      </div>
    </div>
  );
}
