"use client";

import BrainCanvasClient from "@/components/brain/BrainCanvasClient";
import { StatusDot } from "@/components/ui/Card";
import { useLive } from "@/lib/live/context";
import { formatAgo } from "@/lib/live/format";
import { openClaim } from "./ClaimDialog";

// Deterministic (no Math.random) so SSR and client markup match.
const MOTES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37.7 + 11) % 100,
  top: (i * 53.3 + 7) % 100,
  size: 1 + (i % 3),
  dur: 9 + ((i * 7) % 11),
  delay: -((i * 3.1) % 12),
  color: i % 4 === 0 ? "#bfe6ff" : i % 4 === 1 ? "#d674dc" : "#8a5ce0",
}));

export default function BrainStage() {
  const { mode, nodes, currentUserNodeId, selectedId, setSelectedId, pulseEvent, events, now } = useLive();
  const activeId = selectedId ?? currentUserNodeId;
  const node = activeId == null ? undefined : nodes.find((n) => n.id === activeId);
  const justPulsed = activeId != null && pulseEvent?.nodeId === activeId;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        aria-hidden
        className="stage-glow pointer-events-none absolute left-1/2 top-[46%] h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {MOTES.map((m, i) => (
          <span
            key={i}
            className="mote absolute rounded-full"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              background: m.color,
              boxShadow: `0 0 ${m.size * 4}px ${m.color}`,
              animationDuration: `${m.dur}s`,
              animationDelay: `${m.delay}s`,
            }}
          />
        ))}
      </div>
      <BrainCanvasClient
        nodes={nodes}
        selectedId={selectedId}
        currentUserNodeId={currentUserNodeId}
        onSelect={(id) => {
          setSelectedId(id);
          // Real mode: a click on a cell opens its card (claim / connect wallet).
          if (mode === "api") openClaim();
        }}
        pulseEvent={pulseEvent}
      />

      <div className="pointer-events-none absolute left-4 top-4 select-none">
        <div className="font-head text-[9px] text-[var(--muted)]">{`// NODE ${activeId == null ? "--" : String(activeId).padStart(2, "0")}`}</div>
        <div className="font-head mt-1.5 flex items-center gap-1.5 text-[8px] uppercase text-[var(--text-2)]">
          <StatusDot />
          <span className={justPulsed ? "text-[var(--lime)] transition-colors" : "transition-colors"}>
            {node?.status ?? "available"}
          </span>
        </div>
        <div className="mt-1 text-[16px] text-[var(--muted)]">{activeId == null ? "pick a cell" : node?.ownerName ?? (node?.status === "available" ? "unclaimed" : "online")}</div>
      </div>

      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line x1="18" y1="30" x2="34" y2="38" stroke="#3a4180" strokeWidth="0.15" />
        <line x1="78" y1="26" x2="64" y2="34" stroke="#3a4180" strokeWidth="0.15" />
        <line x1="72" y1="78" x2="58" y2="68" stroke="#3a4180" strokeWidth="0.15" />
      </svg>
      <div className="pointer-events-none absolute left-[8%] top-[26%] hidden text-[14px] text-[var(--muted)] lg:block">
        memories grow here
      </div>
      <div className="pointer-events-none absolute right-[8%] top-[22%] hidden text-[14px] text-[var(--muted)] lg:block">
        each cell is a voice
      </div>
      <div className="pointer-events-none absolute bottom-[16%] right-[14%] hidden text-[14px] text-[var(--muted)] lg:block">
        it breathes. it watches.
      </div>

      <ul className="pointer-events-none absolute bottom-3 left-4 space-y-1 text-[16px] text-[var(--muted)]">
        {events.map((e, i) => (
          <li key={e.id} className="fade-in-up flex items-center gap-1.5" style={{ opacity: 1 - i * 0.24 }}>
            <span className="h-1 w-1 rounded-full bg-[var(--lime)]" />
            <span className="uppercase tracking-[0.06em]">{e.text}</span>
            <span className="text-[var(--faint)]">{formatAgo(e.ts, now)}</span>
          </li>
        ))}
      </ul>

      <div className="pointer-events-none absolute bottom-3 right-3 text-[var(--faint)]">+</div>
    </div>
  );
}
