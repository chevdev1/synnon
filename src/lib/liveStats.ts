"use client";

import { useSyncExternalStore } from "react";

// How many real voices the live brain has, whatever mode the visitor is looking at.
// Filled by LiveWatch from /api/nodes.
export const LIVE_MIN = 8; // from this many real voices new visitors start in Live, not in the demo

export interface LiveStats {
  known: boolean;
  taken: number; // cells claimed by real people
  total: number;
  speaking: number; // active + memory
}
const UNKNOWN: LiveStats = { known: false, taken: 0, total: 128, speaking: 0 };
let stats = UNKNOWN;
const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const liveStatsActions = {
  set(next: LiveStats) {
    if (next.known === stats.known && next.taken === stats.taken && next.total === stats.total && next.speaking === stats.speaking) return;
    stats = next;
    listeners.forEach((l) => l());
  },
};
export const useLiveStats = () =>
  useSyncExternalStore(
    subscribe,
    () => stats,
    () => UNKNOWN
  );
