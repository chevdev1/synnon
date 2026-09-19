"use client";

import { useMotion } from "@/lib/motion";

export default function MotionToggle() {
  const { reduced, systemReduced, forcedFull, toggle } = useMotion();
  const on = !reduced;

  return (
    <button
      type="button"
      data-help-id="motion"
      onClick={toggle}
      aria-pressed={on}
      title={
        systemReduced && !forcedFull
          ? "Your system asks for reduced motion. Click to play animations anyway."
          : "Toggle animations"
      }
      className={`pixel-btn font-head flex h-8 items-center gap-2 rounded-sm border px-2.5 text-[8px] uppercase ${
        on ? "border-[var(--lime)] text-[var(--lime)]" : "border-[#ff8a6c] text-[#ff8a6c]"
      }`}
    >
      <span className={`h-2 w-2 ${on ? "bg-[var(--lime)] status-dot" : "bg-[#ff8a6c]"}`} />
      Motion {on ? "on" : "off"}
      {systemReduced && !forcedFull && <span className="hidden text-[var(--muted)] lg:inline">· click</span>}
    </button>
  );
}
