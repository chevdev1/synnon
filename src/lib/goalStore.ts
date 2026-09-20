"use client";

import { useSyncExternalStore } from "react";
import { tierOf, type GoalState } from "@/lib/goal";

// The current community goal on this screen: fetched by GoalSync, or previewed with the
// console's /goal command. Everything (bar, sky effects, page) reads it from here.
export interface GoalView {
  goal: GoalState | null;
  tier: number;
  pct: number; // 0..1
  forced: boolean;
}

const EMPTY: GoalView = { goal: null, tier: 0, pct: 0, forced: false };
let raw: GoalState | null = null;
let forcedPct: number | null = null;
let view: GoalView = EMPTY;
const listeners = new Set<() => void>();

function recompute() {
  if (!raw) {
    view = EMPTY;
  } else {
    const count = forcedPct != null ? Math.round((raw.target * forcedPct) / 100) : raw.count;
    const goal = { ...raw, count };
    view = { goal, tier: tierOf(count, raw.target), pct: raw.target > 0 ? Math.min(1, count / raw.target) : 0, forced: forcedPct != null };
  }
  listeners.forEach((l) => l());
}

export const goalActions = {
  set(g: GoalState | null) {
    raw = g;
    recompute();
  },
  force(pct: number | null) {
    forcedPct = pct;
    recompute();
  },
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const useGoal = () => useSyncExternalStore(subscribe, () => view, () => EMPTY);
