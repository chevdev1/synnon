"use client";

import { useEffect } from "react";
import { setAutoLive } from "@/lib/demo";
import { LIVE_MIN, liveStatsActions } from "@/lib/liveStats";

// Keeps an eye on the real brain (every 90 seconds, whatever mode you are in) so the site can
// tell newcomers how many voices there really are, and start them in Live once it has
// enough life in it. Mounted once in the layout.
export default function LiveWatch() {
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/nodes", { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const d = (await r.json()) as { stats: { total: number; active: number; memory: number; claimed: number } };
        if (cancelled) return;
        const taken = d.stats.active + d.stats.memory + d.stats.claimed;
        liveStatsActions.set({ known: true, taken, total: d.stats.total, speaking: d.stats.active + d.stats.memory });
        setAutoLive(taken >= LIVE_MIN);
      } catch {
        /* no live backend here (e.g. no database): the demo stays the default */
      }
    };
    const first = window.setTimeout(load, 300);
    const id = window.setInterval(load, 90_000);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return null;
}
