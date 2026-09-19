"use client";

import { useEffect, useState } from "react";
import { useLive } from "@/lib/live/context";
import { walletAvailable, type Chain } from "@/lib/wallet";

const EVENT = "synnod:open-claim";
export const openClaim = () => window.dispatchEvent(new Event(EVENT));

const inputCls =
  "h-10 w-full min-w-0 rounded-[3px] border-2 border-[var(--border)] bg-transparent px-3 text-[17px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--lime)]";
const btnCls =
  "pixel-btn font-head flex h-10 shrink-0 items-center justify-center border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 text-[9px] uppercase text-[var(--text)] disabled:opacity-50";

const STATUS_TEXT: Record<string, string> = {
  available: "free — nobody's voice yet",
  claimed: "claimed, waiting for its first words",
  active: "speaking right now",
  memory: "holds a memory",
  featured: "featured by the mind",
};

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

export default function ClaimDialog() {
  const { mode, me, nodes, selectedId, signIn, signInWithWallet, claim, logout } = useLive();
  const [open, setOpen] = useState(false);
  const [nick, setNick] = useState("");
  const [guest, setGuest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  if (!open) return null;

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
    else setMsg(r.error);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Claim a node"
    >
      <div className="fade-in-up w-full max-w-md rounded-[3px] border-2 border-[var(--accent)] bg-[var(--panel)] p-5 shadow-[6px_6px_0_rgba(108,95,214,0.5)]">
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
          <p className="mt-4 text-[17px] leading-snug text-[var(--text-2)]">
            You are looking at the simulated demo. Switch the header toggle to <span className="text-[var(--lime)]">Live data</span> to connect a wallet and claim a real node.
          </p>
        ) : !me ? (
          <div className="mt-4 space-y-3">
            <p className="text-[17px] leading-snug text-[var(--text-2)]">
              {target && !canClaim ? "Connect to look around and claim a free cell of your own." : "Connect a wallet to claim this cell. You only sign a message — no transaction, no fee."}
            </p>
            <WalletButton chain="sol" name="Phantom" sub="Solana" busy={busy} onPick={pickWallet} />
            <WalletButton chain="evm" name="MetaMask & EVM wallets" sub="Ethereum-compatible" busy={busy} onPick={pickWallet} />
            {!guest ? (
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
            )}
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
            ) : target ? (
              canClaim ? (
                <button type="button" disabled={busy} onClick={doClaim} className={btnCls}>
                  {busy ? "Claiming…" : `Claim ${nodeLabel} →`}
                </button>
              ) : (
                <p className="text-[#ff8a6c]">That cell is already taken. Pick a free one on the brain.</p>
              )
            ) : (
              <p>Click a cell on the brain to choose which node to claim.</p>
            )}
            {!me.wallet && (
              <div className="space-y-2 border-t-2 border-[var(--divider)] pt-3">
                <p className="text-[16px] leading-snug text-[var(--muted)]">Link a wallet so this node survives clearing your browser.</p>
                <WalletButton chain="sol" name="Link Phantom" sub="Solana" busy={busy} onPick={pickWallet} />
                <WalletButton chain="evm" name="Link MetaMask / EVM" sub="Ethereum-compatible" busy={busy} onPick={pickWallet} />
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
