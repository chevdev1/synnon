"use client";

import { LegendHex } from "@/components/ui/PixelIcon";
import { StatusDot } from "@/components/ui/Card";
import ActivityLine from "./ActivityLine";
import { useLive } from "@/lib/live/context";
import { formatAgo } from "@/lib/live/format";
import { openClaim } from "./ClaimDialog";

function LiveCount({ value }: { value: number }) {
  return (
    <span key={value} className="fade-in-up ml-auto text-[var(--text)]">
      {value}
    </span>
  );
}

export default function HeroLeft() {
  const { stats, activitySeries, now, lastMemoryTs, me } = useLive();

  return (
    <div className="flex h-full flex-col justify-between gap-3 p-4">
      <div>
        <h1 className="font-head text-[17px] leading-[1.6] text-[var(--text)]">
          128 voices.
          <br />
          <span className="text-[var(--lime)]">One mind.</span>
        </h1>
        <p className="mt-3 text-[17px] leading-snug text-[var(--text-2)] [@media(max-height:940px)]:hidden">
          Claim a cell. Leave a memory. Watch one character grow from everyone who speaks to it.
        </p>
        <button
          type="button"
          onClick={openClaim}
          className="pixel-btn shimmer-border font-head mt-4 flex h-11 items-center gap-2 border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 text-[9px] uppercase text-[var(--text)]"
        >
          {me?.nodeId ? `Node ${String(me.nodeId).padStart(2, "0")}` : "Claim node"} <span aria-hidden>→</span>
        </button>
      </div>

      <div className="shrink-0 border-t border-[var(--divider)] pt-3">
        <div className="font-head text-[8px] uppercase text-[var(--muted)]">The brain</div>
        <div className="font-head mt-1 text-[10px] text-[var(--text)]">128 cells</div>

        <ul className="mt-2 space-y-1 text-[16px] text-[var(--text-2)]">
          <li className="fade-in-up flex items-center gap-2" style={{ animationDelay: "60ms" }}>
            <LegendHex fill="var(--cell-blue)" /> active <LiveCount value={stats.active} />
          </li>
          <li className="fade-in-up flex items-center gap-2" style={{ animationDelay: "120ms" }}>
            <LegendHex fill="none" outline="var(--lime)" /> your node
          </li>
          <li className="fade-in-up flex items-center gap-2" style={{ animationDelay: "180ms" }}>
            <LegendHex fill="var(--cell-violet)" /> memory <LiveCount value={stats.memory} />
          </li>
          <li className="fade-in-up flex items-center gap-2" style={{ animationDelay: "240ms" }}>
            <LegendHex fill="var(--cell-idle)" outline="var(--border)" /> available <LiveCount value={stats.available} />
          </li>
        </ul>

        <div className="mt-2">
          <ActivityLine series={activitySeries} />
        </div>

        <div className="mt-2 flex items-center gap-2 text-[15px] text-[var(--text-2)]">
          <StatusDot />
          <span>The mind is awake.</span>
        </div>
        <div className="mt-1 text-[14px] text-[var(--muted)]">
          {lastMemoryTs == null ? "No memories yet" : `Last memory: ${formatAgo(lastMemoryTs, now)}`}
        </div>
      </div>
    </div>
  );
}
