"use client";

import { helpActions, useHelp } from "@/lib/help";

export default function HelpButton() {
  const h = useHelp();
  return (
    <button
      type="button"
      onClick={helpActions.toggle}
      aria-pressed={h.on}
      aria-label="Help: explain each block"
      title="Help: explain each block"
      className={`pixel-btn font-head flex h-8 w-8 items-center justify-center border-2 text-[11px] ${
        h.on ? "border-[var(--lime)] bg-[var(--lime)] text-[#06071a]" : "border-[var(--cell-pink)] text-[var(--cell-pink)]"
      }`}
    >
      ?
    </button>
  );
}
