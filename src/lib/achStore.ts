"use client";

import { useSyncExternalStore } from "react";
import { ACH_BY_ID } from "./achievements";
import { read as readDemo } from "./demo";
import { sfx } from "./sfx";

// Which achievements this browser has unlocked, progress counters, and the queue of
// pop-ups still to show. Derived achievements (wallet, voices...) are re-checked
// against real data by the watcher, so clearing the browser only loses the
// "things you did" ones, never what your cell earned.
// Demo and live keep separate books: what a simulated "you" earns in the demo must
// never count as a real achievement.
let ns: "live" | "demo" = "live";
const keyOf = () => (ns === "demo" ? "synnod-ach-demo" : "synnod-ach");

interface Saved {
  unlocked: Record<string, number>; // id -> unlocked at (ms)
  prog: Record<string, number>; // id -> progress counter
  tods: string[]; // times of day seen (sun-chaser)
}
export type Toast = { id: string; preview?: boolean } | { text: string };

const EMPTY: Saved = { unlocked: {}, prog: {}, tods: [] };
let state: Saved = EMPTY;
let loaded = false;
let queue: Toast[] = [];
let ownClaimAt = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load() {
  if (loaded) return;
  loaded = true;
  ns = readDemo() ? "demo" : "live";
  try {
    const raw = window.localStorage.getItem(keyOf());
    state = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Saved>) } : EMPTY;
  } catch {
    state = EMPTY; /* storage blocked or corrupt: start empty */
  }
}
function save(next: Saved) {
  state = next;
  try {
    window.localStorage.setItem(keyOf(), JSON.stringify(state));
  } catch {
    /* ignore */
  }
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const useAch = () =>
  useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY
  );
const EMPTY_QUEUE: Toast[] = []; // must be one stable object: React compares snapshots by identity
export const useToastQueue = () => useSyncExternalStore(subscribe, () => queue, () => EMPTY_QUEUE);

export const achActions = {
  unlock(id: string, opts: { silent?: boolean } = {}) {
    load();
    const a = ACH_BY_ID.get(id);
    if (!a || state.unlocked[id]) return false;
    save({ ...state, unlocked: { ...state.unlocked, [id]: Date.now() } });
    if (!opts.silent) {
      queue = [...queue, { id }];
      emit();
    }
    return true;
  },
  // Your own claim also broadcasts a "claimed" event; that must not count as witnessing someone else's.
  noteOwnClaim() {
    ownClaimAt = Date.now();
  },
  recentOwnClaim() {
    return Date.now() - ownClaimAt < 10_000;
  },
  // The demo toggle was flipped: switch to the other book.
  setMode(mode: "live" | "demo") {
    load();
    if (mode === ns) return;
    ns = mode;
    queue = [];
    try {
      const raw = window.localStorage.getItem(keyOf());
      state = raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Saved>) } : EMPTY;
    } catch {
      state = EMPTY;
    }
    emit();
  },
  // Remember a derived counter without unlocking anything.
  record(id: string, cur: number) {
    load();
    if (cur > (state.prog[id] ?? 0)) save({ ...state, prog: { ...state.prog, [id]: cur } });
  },
  // Progress toward a progressive achievement; unlocks it when it reaches max.
  progress(id: string, cur: number) {
    load();
    const a = ACH_BY_ID.get(id);
    if (!a) return;
    const best = Math.max(state.prog[id] ?? 0, cur);
    if (best !== state.prog[id]) save({ ...state, prog: { ...state.prog, [id]: best } });
    if (best >= (a.max ?? 1)) this.unlock(id);
  },
  bump(id: string, by = 1) {
    load();
    this.progress(id, (state.prog[id] ?? 0) + by);
  },
  noteTod(phase: string) {
    load();
    if (state.tods.includes(phase)) return;
    const tods = [...state.tods, phase];
    save({ ...state, tods });
    this.progress("sun-chaser", tods.length);
  },
  // Many at once (e.g. a fresh browser for an old account): one summary instead of a wall of pop-ups.
  restored(n: number) {
    queue = [...queue, { text: `${n}` }];
    emit();
  },
  // A preview jumps the queue so you see it right away.
  preview(id: string) {
    queue = [{ id, preview: true }, ...queue];
    emit();
  },
  shift() {
    queue = queue.slice(1);
    emit();
  },
  reset() {
    queue = [];
    save(EMPTY);
  },
  playFor(tier: "bronze" | "silver" | "gold" | "legend") {
    sfx.achieve(tier);
  },
};
