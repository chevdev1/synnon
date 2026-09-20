"use client";

import { useEffect, useMemo, useState } from "react";
import type { BrainNode } from "@/lib/brain/types";
import { demoResonance, type Resonance } from "@/lib/resonance";

// Resonant pairs: simulated in the demo, from the server (every 2 minutes) in live mode.
export function useResonance(demo: boolean, nodes: BrainNode[], mine: number | null = null): Resonance[] {
  const [live, setLive] = useState<Resonance[]>([]);
  const takenKey = nodes.filter((n) => n.status !== "available").map((n) => n.id).join(",");
  const simulated = useMemo(() => demoResonance(takenKey ? takenKey.split(",").map(Number) : [], mine), [takenKey, mine]);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    const load = () =>
      fetch("/api/resonance", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { pairs: [] }))
        .then((d) => !cancelled && setLive(d.pairs ?? []))
        .catch(() => {});
    const first = window.setTimeout(load, 0);
    const id = window.setInterval(load, 120_000);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [demo]);

  return demo ? simulated : live;
}
