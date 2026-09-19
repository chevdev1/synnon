"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { MemoryIcon } from "@/components/ui/PixelIcon";
import { MEMORY_ITEMS } from "@/lib/mock/data";
import { iconForNode, useLive } from "@/lib/live/context";
import { formatAgo } from "@/lib/live/format";

const TABS = ["recent", "popular", "mine"] as const;

interface Row {
  id: number;
  icon: string;
  title: string;
  nodeId: number;
  timeAgo: string;
  live: boolean;
}

export default function MemoryCard() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("recent");
  const { mode, memories, now, me } = useLive();
  const [remote, setRemote] = useState<Row[]>([]);

  // Real mode: popular/mine come from the archive API; "recent" refreshes
  // whenever the live feed adds a memory.
  const memCount = memories.length;
  const uid = me?.name;
  useEffect(() => {
    if (mode !== "api") return;
    let cancelled = false;
    void fetch(`/api/memory?tab=${tab}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d: { items: { id: number; nodeId: number | null; title: string; createdAt: string }[] }) => {
        if (cancelled) return;
        setRemote(
          d.items.map((m) => ({
            id: m.id,
            icon: iconForNode(m.nodeId ?? 0),
            title: m.title,
            nodeId: m.nodeId ?? 0,
            timeAgo: formatAgo(new Date(m.createdAt).getTime(), Date.now()),
            live: false,
          }))
        );
      })
      .catch(() => !cancelled && setRemote([]));
    return () => {
      cancelled = true;
    };
  }, [mode, tab, memCount, uid]);

  let items: Row[];
  if (mode === "api") items = remote;
  else {
    const seeded = MEMORY_ITEMS.filter((m) => m.tab === tab).map((m) => ({ ...m, live: false }));
    const fresh =
      tab === "recent"
        ? memories.map((m) => ({ id: m.id, icon: m.icon, title: m.title, nodeId: m.nodeId, timeAgo: formatAgo(m.ts, now), live: true }))
        : [];
    items = [...fresh, ...seeded];
  }

  return (
    <Card help="memory" className="flex h-full min-h-0 flex-col" id="memory">
      <div className="flex shrink-0 items-center justify-between">
        <CardTitle>Memory</CardTitle>
        <div className="font-head flex gap-2.5 text-[8px] uppercase text-[var(--muted)]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`transition-colors ${t === tab ? "text-[var(--lime)]" : "hover:text-[var(--text-2)]"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <ul key={tab} className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {items.length === 0 && <li className="text-[15px] text-[var(--muted)]">Nothing here yet.</li>}
        {items.map((m, i) => (
          <li
            key={`${m.live ? "live" : "seed"}-${m.id}`}
            className={`fade-in-up flex items-center gap-3 rounded-md transition-colors hover:bg-white/[0.03] ${m.live ? "memory-new" : ""}`}
            style={{ animationDelay: `${Math.min(i, 4) * 60}ms` }}
          >
            <MemoryIcon type={m.icon} />
            <div className="min-w-0">
              <div className="truncate text-[17px] text-[var(--text)]">{m.title}</div>
              <div className="text-[15px] text-[var(--muted)]">
                Node {String(m.nodeId).padStart(2, "0")} · {m.timeAgo}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
