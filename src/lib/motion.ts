"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "synnod-motion";
const MQ = "(prefers-reduced-motion: reduce)";
const listeners = new Set<() => void>();
let applied = false;

function readFull(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "full";
  } catch {
    return false;
  }
}

function apply() {
  document.documentElement.toggleAttribute("data-motion", false);
  if (readFull()) document.documentElement.setAttribute("data-motion", "full");
  else document.documentElement.removeAttribute("data-motion");
}

function emit() {
  apply();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  if (!applied) {
    applied = true;
    apply();
  }
  listeners.add(cb);
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", cb);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", cb);
  };
}

// "<systemReduced><forcedFull>" — a primitive so useSyncExternalStore stays stable.
function snapshot(): string {
  return `${window.matchMedia(MQ).matches ? 1 : 0}${readFull() ? 1 : 0}`;
}

function serverSnapshot(): string {
  return "00";
}

export function useMotion() {
  const s = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const systemReduced = s[0] === "1";
  const forcedFull = s[1] === "1";
  const toggle = useCallback(() => {
    try {
      if (readFull()) window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, "full");
    } catch {
      /* storage blocked: attribute-only fallback below */
      const on = document.documentElement.getAttribute("data-motion") === "full";
      if (on) document.documentElement.removeAttribute("data-motion");
      else document.documentElement.setAttribute("data-motion", "full");
    }
    emit();
  }, []);
  return { reduced: systemReduced && !forcedFull, systemReduced, forcedFull, toggle };
}
