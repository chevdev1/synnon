"use client";

import { useSyncExternalStore } from "react";
import { achActions } from "@/lib/achStore";
import { notifyActions } from "@/lib/notify";
import { PET_BY_ID } from "@/lib/pets";
import { dayKey } from "@/lib/quests";

// Companions grow up with you. Every calendar day you spend on the site with a companion
// chosen counts as one "day together"; enough of them and it evolves. It is remembered
// per companion in this browser, so changing pets never resets the others.
type T = { en: string; ru: string };
export const BOND_STAGES: { at: number; name: T; ach?: string }[] = [
  { at: 1, name: { en: "Hatchling", ru: "Малыш" } },
  { at: 3, name: { en: "Grown", ru: "Подросток" }, ach: "pet-grown" },
  { at: 10, name: { en: "Elder", ru: "Взрослый" }, ach: "pet-elder" },
  { at: 30, name: { en: "Legend", ru: "Легенда" }, ach: "pet-legend" },
];

export const stageOfDays = (days: number) => (days >= 30 ? 3 : days >= 10 ? 2 : days >= 3 ? 1 : 0);
export const nextStageAt = (stage: number) => BOND_STAGES[stage + 1]?.at ?? null;

const KEY = "synnod-pet-bond";
type Saved = Record<string, string[]>; // pet id -> day keys spent together
let state: Saved = {};
let loaded = false;
let version = 0;
const listeners = new Set<() => void>();
const cache = new Map<string, { v: number; days: number; stage: number }>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw) as Saved;
  } catch {
    /* storage blocked */
  }
}
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const bondActions = {
  // Call once the companion is on screen; counts today if it has not been counted yet.
  touch(petId: string) {
    load();
    const today = dayKey();
    const days = state[petId] ?? [];
    if (days.includes(today)) return;
    state = { ...state, [petId]: [...days, today].slice(-400) };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    const n = state[petId].length;
    for (const s of BOND_STAGES) if (s.ach && n >= s.at) achActions.unlock(s.ach);
    const stage = stageOfDays(n);
    if (stage > stageOfDays(n - 1)) {
      const pet = PET_BY_ID.get(petId);
      const st = BOND_STAGES[stage].name;
      if (pet) notifyActions.push({ kind: "pet", key: `pet-${petId}-${stage}`, en: `${pet.name.en} evolved: ${st.en}. ${n} days together.`, ru: `${pet.name.ru} вырос: ${st.ru}. Дней вместе: ${n}.` });
    }
    emit();
  },
};

const EMPTY = { v: -1, days: 0, stage: 0 };
export function useBond(petId: string | null) {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      if (!petId) return EMPTY;
      const hit = cache.get(petId);
      if (hit && hit.v === version) return hit;
      const days = state[petId]?.length ?? 0;
      const next = { v: version, days, stage: stageOfDays(days) };
      cache.set(petId, next);
      return next;
    },
    () => EMPTY
  );
}
