"use client";

import { useEffect, useMemo, useState } from "react";
import type { BrainNode } from "@/lib/brain/types";
import { demoChorus, demoResonance, type Chorus, type Resonance } from "@/lib/resonance";

// Resonant pairs and choruses: simulated in the demo, from the server (every 2 minutes) in live mode.
export function useResonance(demo: boolean, nodes: BrainNode[], mine: number | null = null): { pairs: Resonance[]; choruses: Chorus[] } {
  const [live, setLive] = useState<{ pairs: Resonance[]; choruses: Chorus[] }>({ pairs: [], choruses: [] });
  const takenKey = nodes.filter((n) => n.status !== "available").map((n) => n.id).join(",");
  const simulated = useMemo(() => {
    const ids = takenKey ? takenKey.split(",").map(Number) : [];
    return { pairs: demoResonance(ids, mine), choruses: demoChorus(ids, mine) };
  }, [takenKey, mine]);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    const load = () =>
      fetch("/api/resonance", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { pairs: [], choruses: [] }))
        .then((d) => !cancelled && setLive({ pairs: d.pairs ?? [], choruses: d.choruses ?? [] }))
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
