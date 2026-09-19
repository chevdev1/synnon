"use client";

import { useLive } from "@/lib/live/context";
import { openClaim } from "./ClaimDialog";

// The one obvious way in: "Connect wallet" when signed out, a chip with the
// account (and node) when signed in. Opens the same dialog as clicking a cell.
export default function AuthButton() {
  const { mode, me } = useLive();
  const signedIn = mode === "api" && me;

  if (!signedIn) {
    return (
      <button
        type="button"
        onClick={openClaim}
        className="pixel-btn shimmer-border font-head flex h-8 items-center gap-2 border-2 border-[var(--lime)] bg-[var(--lime)]/10 px-3 text-[8px] uppercase text-[var(--lime)]"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden>
          <path d="M1 3h9v1H2v5h8V7H8V5h3v5H1z" fill="currentColor" />
        </svg>
        Connect wallet
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={openClaim}
      title="Your account"
      className="pixel-btn font-head flex h-8 max-w-[220px] items-center gap-2 border-2 border-[var(--lime)] px-3 text-[8px] uppercase text-[var(--lime)]"
    >
      <span className="h-2 w-2 shrink-0 bg-[var(--lime)] status-dot" />
      <span className="truncate">{me.wallet ?? me.name}</span>
      {me.nodeId ? <span className="shrink-0 text-[var(--text-2)]">#{String(me.nodeId).padStart(2, "0")}</span> : null}
    </button>
  );
}
