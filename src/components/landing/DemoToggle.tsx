"use client";

import { useDemo } from "@/lib/demo";

export default function DemoToggle() {
  const { on, toggle } = useDemo();
  return (
    <button
      type="button"
      data-help-id="demo"
      onClick={toggle}
      aria-pressed={on}
      title={on ? "Showing simulated activity. Click to see real data." : "Showing real data. Click for a simulated demo."}
      className={`pixel-btn font-head flex h-8 items-center gap-2 rounded-sm border px-2.5 text-[8px] uppercase ${
        on ? "border-[#ffd166] text-[#ffd166]" : "border-[var(--border)] text-[var(--muted)]"
      }`}
    >
      <span className={`h-2 w-2 ${on ? "bg-[#ffd166] status-dot" : "bg-[var(--faint)]"}`} />
      {on ? "Demo data" : "Live data"}
    </button>
  );
}
