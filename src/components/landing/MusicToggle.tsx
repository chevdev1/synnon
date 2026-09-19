"use client";

import { useMusic } from "@/lib/lofi";

const BARS = [0, 1, 2, 3];

export default function MusicToggle() {
  const { playing, toggle } = useMusic();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      title={playing ? "Pause the lofi" : "Play some lofi"}
      className={`pixel-btn font-head flex h-8 items-center gap-2 rounded-sm border px-2.5 text-[8px] uppercase ${
        playing ? "border-[var(--cell-pink)] text-[var(--cell-pink)]" : "border-[var(--border)] text-[var(--muted)]"
      }`}
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {BARS.map((i) => (
          <span
            key={i}
            className={`w-[2px] bg-current ${playing ? "eq-bar" : ""}`}
            style={{ height: playing ? undefined : 3, animationDelay: `${i * 130}ms` }}
          />
        ))}
      </span>
      {playing ? "Lofi on" : "Lofi off"}
    </button>
  );
}
