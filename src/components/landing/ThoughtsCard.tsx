"use client";

import { Card, CardTitle, StatusDot } from "@/components/ui/Card";
import { useLive } from "@/lib/live/context";
import { formatAgo } from "@/lib/live/format";

export default function ThoughtsCard() {
  const { thoughts, now } = useLive();

  return (
    <Card className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between">
        <CardTitle>Autonomous thoughts</CardTitle>
        <span className="font-head flex items-center gap-1.5 text-[8px] uppercase text-[var(--lime)]">
          <StatusDot /> live
        </span>
      </div>
      <ul className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {thoughts.length === 0 && (
          <li className="text-[16px] leading-snug text-[var(--muted)]">
            Nothing yet. The mind thinks out loud once it has something to think about.
          </li>
        )}
        {thoughts.map((t, i) => (
          <li
            key={t.id}
            className="fade-in-up text-[17px] leading-snug text-[var(--text-2)]"
            style={{ animationDelay: `${Math.min(i, 3) * 60}ms` }}
          >
            <span className="text-[var(--muted)]">• {formatAgo(t.ts, now)} - </span>
            <span className={i === 0 ? "text-[var(--text)]" : undefined}>{t.text}</span>
            {i === 0 && <span className="cursor-blink text-[var(--lime)]">▌</span>}
          </li>
        ))}
      </ul>
    </Card>
  );
}
