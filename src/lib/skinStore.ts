"use client";

import { useSyncExternalStore } from "react";
import type { BrainNode } from "@/lib/brain/types";
import { isSkin, SKINS } from "@/lib/skins";

// In the demo there is no server: the skin you pick is remembered in this browser, and a few
// other simulated cells wear skins too, so the demo shows what it looks like.
const KEY = "synnod-skin-demo";
const listeners = new Set<() => void>();
let mine: string | null = null;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const v = window.localStorage.getItem(KEY);
    mine = isSkin(v) ? v : null;
  } catch {
    /* storage blocked */
  }
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useDemoSkin = () => useSyncExternalStore(subscribe, () => (load(), mine ?? ""), () => "") || null;

export const demoSkinActions = {
  set(skin: string | null) {
    load();
    mine = skin;
    try {
      if (skin) window.localStorage.setItem(KEY, skin);
      else window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  },
};

// Nodes for the demo: your own cell wears your choice, and roughly one taken cell in seven wears a
// simulated skin.
export function withDemoSkins(nodes: BrainNode[], myNodeId: number | null, mySkin: string | null): BrainNode[] {
  return nodes.map((n) => {
    if (n.id === myNodeId) return { ...n, skin: mySkin };
    if (n.status === "available") return n;
    const h = (n.id * 2654435761) >>> 0;
    return h % 7 === 0 ? { ...n, skin: SKINS[(h >>> 8) % SKINS.length].id } : n;
  });
}
