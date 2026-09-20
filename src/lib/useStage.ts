"use client";

import { useSyncExternalStore } from "react";
import { useLive } from "@/lib/live/context";
import { STAGES, stageProgress } from "@/lib/stages";

// The stage of the mind on this screen: from the claimed cells, or a temporary override
// from the console (/stage 3) so the growth effects can be previewed.
const listeners = new Set<() => void>();
let forced: number | null = null;
let timer: number | undefined;

export const stageActions = {
  force(id: number | null, ms = 45_000) {
    forced = id;
    window.clearTimeout(timer);
    if (id != null) timer = window.setTimeout(() => ((forced = null), listeners.forEach((l) => l())), ms);
    listeners.forEach((l) => l());
  },
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useStage() {
  const { stats, mode } = useLive();
  const f = useSyncExternalStore(subscribe, () => forced, () => null);
  const taken = stats.total - stats.available;
  const real = stageProgress(taken, stats.total);
  const stage = f != null ? STAGES[Math.max(0, Math.min(5, f))] : real.stage;
  return { ...real, stage, realStage: real.stage, forced: f != null, taken, total: stats.total, mode };
}
