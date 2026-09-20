"use client";

import { useSyncExternalStore } from "react";
import { achActions } from "./achStore";
import { read as readDemo } from "./demo";
import { QUEST_BY_ID, dayKey, questsForDay, yesterdayKey, type QEvent } from "./quests";
import { sfx } from "./sfx";
import { skyActions } from "./sky";

interface DayRec {
  p: Record<string, number>; // quest id -> progress
  d: string[]; // quest ids done
}
interface Saved {
  days: Record<string, DayRec>;
  streak: { count: number; last: string; best: number };
}

const EMPTY: Saved = { days: {}, streak: { count: 0, last: "", best: 0 } };
let ns: "live" | "demo" = "live";
const keyOf = () => (ns === "demo" ? "synnod-quests-demo" : "synnod-quests");
let state: Saved = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): Saved {
  try {
    const raw = window.localStorage.getItem(keyOf());
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Saved>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}
function load() {
  if (loaded) return;
  loaded = true;
  ns = readDemo() ? "demo" : "live";
  state = read();
}
function save(next: Saved) {
  // keep the last 30 days only
  const keep = Object.keys(next.days).sort().slice(-30);
  state = { ...next, days: Object.fromEntries(keep.map((k) => [k, next.days[k]])) };
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
export const useQuestBook = () =>
  useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => EMPTY
  );

// The streak as it stands today: it survives until the end of tomorrow, then it is broken.
export function streakOf(s: Saved, today = dayKey()): number {
  return s.streak.last === today || s.streak.last === yesterdayKey() ? s.streak.count : 0;
}
export function currentStreak(): number {
  load();
  return streakOf(state);
}

export const questActions = {
  // Something happened on the site (a search, a timelapse...): advance the quests it belongs to.
  event(type: QEvent, by = 1) {
    load();
    const today = dayKey();
    const rec: DayRec = { p: { ...(state.days[today]?.p ?? {}) }, d: [...(state.days[today]?.d ?? [])] };
    let changed = false;
    let firstOfDay = rec.d.length === 0;
    const quests = questsForDay(today);
    for (const qq of quests) {
      if (qq.event !== type || rec.d.includes(qq.id)) continue;
      rec.p[qq.id] = Math.min(qq.target, (rec.p[qq.id] ?? 0) + by);
      changed = true;
      if (rec.p[qq.id] >= qq.target) {
        rec.d.push(qq.id);
        this.toast({ quest: qq.id });
        if (firstOfDay) {
          firstOfDay = false;
          this.bumpStreak(today);
        }
      }
    }
    if (!changed) return;
    const all = quests.every((x) => rec.d.includes(x.id));
    save({ ...state, days: { ...state.days, [today]: rec } });
    if (all) {
      this.toast({ quest: "*", all: true });
      achActions.unlock("daily-trio");
    }
  },
  bumpStreak(today: string) {
    const s = state.streak;
    const count = s.last === today ? s.count : s.last === yesterdayKey() ? s.count + 1 : 1;
    state = { ...state, streak: { count, last: today, best: Math.max(s.best, count) } };
    achActions.progress("streak-week", count);
    achActions.progress("streak-month", count);
  },
  toast(t: { quest: string; all?: boolean }) {
    achActions.pushQuestToast(t);
    sfx.achieve(t.all ? "gold" : "silver");
    if (t.all) skyActions.pulse(0.9);
  },
  // demo/live keep separate books
  setMode(mode: "live" | "demo") {
    load();
    if (mode === ns) return;
    ns = mode;
    state = read();
    emit();
  },
  // demo only, from the daily page: advance a quest by hand so the effects can be seen
  demoAdvance(id: string) {
    const qq = QUEST_BY_ID.get(id);
    if (qq) this.event(qq.event);
  },
  reset() {
    save(EMPTY);
  },
};
