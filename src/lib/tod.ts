"use client";

import { useCallback, useSyncExternalStore } from "react";

// Time of day: the whole site (brain palette, glow, background) follows the
// visitor's local clock. "auto" tracks the hour; the chip in the header (or
// ?tod=dawn|day|dusk|night) pins a phase.
export type Tod = "dawn" | "day" | "dusk" | "night";
export type TodMode = "auto" | Tod;

const KEY = "synnod-tod";
const MODES: TodMode[] = ["auto", "dawn", "day", "dusk", "night"];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// How the brain's own pixels are recoloured per phase (night = the original palette).
// Violet→pink at dawn, →blue by day, →magenta at dusk.
export const TOD_FILTER: Record<Tod, string> = {
  dawn: "hue-rotate(62deg) saturate(1.1) brightness(1.1)",
  day: "hue-rotate(-40deg) saturate(0.92) brightness(1.18)",
  dusk: "hue-rotate(28deg) saturate(1.15) brightness(1.04)",
  night: "none",
};

export function phaseForHour(h: number): Tod {
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 20) return "dusk";
  return "night";
}

function readMode(): TodMode {
  try {
    const q = new URLSearchParams(window.location.search).get("tod");
    if (q && MODES.includes(q as TodMode)) return q as TodMode;
    const v = window.localStorage.getItem(KEY);
    if (v && MODES.includes(v as TodMode)) return v as TodMode;
  } catch {
    /* storage blocked */
  }
  return "auto";
}

const snapshot = () => {
  const mode = readMode();
  return `${mode}|${mode === "auto" ? phaseForHour(new Date().getHours()) : mode}`;
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useTod() {
  const s = useSyncExternalStore(subscribe, snapshot, () => "auto|night");
  const [mode, phase] = s.split("|") as [TodMode, Tod];
  const cycle = useCallback(() => {
    const next = MODES[(MODES.indexOf(readMode()) + 1) % MODES.length];
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    emit();
  }, []);
  return { mode, phase, cycle };
}

// Set a phase directly (the console's /tod command).
export const todActions = {
  set(mode: TodMode) {
    try {
      window.localStorage.setItem(KEY, mode);
    } catch {
      /* ignore */
    }
    emit();
  },
};

// Re-evaluates "auto" as the hour rolls over.
export const refreshTod = emit;
