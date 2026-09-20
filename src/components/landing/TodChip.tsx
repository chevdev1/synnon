"use client";

import { useTod } from "@/lib/tod";
import { questActions } from "@/lib/questStore";

const COLOR = { dawn: "#ff9b7a", day: "#7fd6ff", dusk: "#e58bd8", night: "#b9a6f5" } as const;

// Cycles auto → dawn → day → dusk → night. Auto follows the visitor's clock.
export default function TodChip() {
  const { mode, phase, cycle } = useTod();
  const c = COLOR[phase];
  return (
    <button
      type="button"
      onClick={() => {
        cycle();
        questActions.event("tod");
      }}
      data-help-id="tod"
      aria-label={`Time of day: ${phase}${mode === "auto" ? " (automatic)" : ""}. Click to change.`}
      className="pixel-btn font-head flex h-11 items-center gap-2 border-2 px-3 text-[8px] uppercase sm:h-9"
      style={{ borderColor: c, color: c }}
    >
      <span className="h-2 w-2" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
      {phase}
      <span className="text-[var(--muted)]">{mode === "auto" ? "auto" : "set"}</span>
    </button>
  );
}
