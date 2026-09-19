"use client";

import { useCallback, useSyncExternalStore } from "react";

// DEMO shows a simulated, clearly-labelled feed so the interface has life in
// it before real traffic exists. Default: on while developing, off in
// production. The visitor's explicit choice always wins.
const KEY = "synnod-demo";
const DEFAULT_ON = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SYNNOD_DEFAULT_DEMO === "1";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === null ? DEFAULT_ON : v === "on";
  } catch {
    return DEFAULT_ON;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useDemo() {
  const on = useSyncExternalStore(subscribe, read, () => DEFAULT_ON);
  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(KEY, read() ? "off" : "on");
    } catch {
      /* storage blocked: choice just won't persist */
    }
    listeners.forEach((l) => l());
  }, []);
  return { on, toggle };
}
