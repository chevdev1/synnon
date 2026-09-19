"use client";

import type { TlView } from "./useTimelapse";

const span = (ms: number) => {
  const m = Math.round(ms / 60_000);
  if (m < 2) return "1 min";
  if (m < 120) return `${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} days`;
};

const fmt = (ms: number) =>
  new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

// Controls + a running clock for the timelapse; sits at the bottom of the brain stage.
export default function TimelapseBar({
  view,
  onToggle,
  onSpeed,
  onClose,
}: {
  view: TlView;
  onToggle: () => void;
  onSpeed: () => void;
  onClose: () => void;
}) {
  const busy = view.phase === "loading";
  const msg =
    view.phase === "loading"
      ? "loading the history…"
      : view.phase === "empty"
        ? "Not enough history yet. Come back after a few voices have spoken."
        : view.phase === "error"
          ? "Couldn't load the history."
          : null;

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 mx-auto max-w-[520px] border-2 border-[var(--accent)] bg-[#080a20]/92 p-2.5 shadow-[4px_4px_0_rgba(108,95,214,0.4)]" role="group" aria-label="Timelapse controls" data-timelapse-bar>
      {msg ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[17px] text-[var(--text-2)]">{msg}</span>
          {!busy && (
            <button type="button" onClick={onClose} className="font-head h-8 shrink-0 border-2 border-[var(--border)] px-2 text-[8px] uppercase text-[var(--muted)] hover:text-[var(--text)]">
              Close
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="font-head text-[8px] uppercase text-[var(--lime)]" data-tl-clock>
              {fmt(view.clock)} <span className="text-[var(--muted)]">· replaying {span(view.span)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={onToggle} aria-label={view.phase === "done" ? "Replay" : view.phase === "paused" ? "Play" : "Pause"} className="pixel-btn font-head h-8 min-w-8 border-2 border-[var(--accent)] px-2 text-[9px] text-[var(--text)]">
                {view.phase === "done" ? "↺" : view.phase === "paused" ? "▶" : "❚❚"}
              </button>
              <button type="button" onClick={onSpeed} aria-label="Change speed" className="pixel-btn font-head h-8 border-2 border-[var(--border)] px-2 text-[8px] text-[var(--text-2)]">
                {view.speed}x
              </button>
              <button type="button" onClick={onClose} aria-label="Close timelapse" className="font-head h-8 w-8 border-2 border-[var(--border)] text-[10px] text-[var(--muted)] hover:text-[#ff8a6c]">
                ✕
              </button>
            </div>
          </div>
          <div className="mt-2 h-2 w-full bg-[var(--border)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(view.progress * 100)}>
            <div className="h-full bg-[var(--lime)]" style={{ width: `${view.progress * 100}%` }} />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 text-[15px] text-[var(--text-2)]" data-tl-counts>
            <span>{view.counts.claims} claimed</span>
            <span>{view.counts.voices} spoke</span>
            <span>{view.counts.thoughts} thoughts</span>
          </div>
        </>
      )}
    </div>
  );
}
