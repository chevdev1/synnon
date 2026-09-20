"use client";

import { useSyncExternalStore } from "react";
import { read as readDemo } from "@/lib/demo";

// In-app notifications, made only from things this browser really saw (a resonance
// with your cell, a thought that grew from your words, the new question, a goal tier, your
// pet growing up, a streak about to end). They live in this browser, and optionally show as
// system notifications while the site is open in a background tab. Nothing is pushed when
// the site is closed: that would need a server and your consent, which this does not have.
export type NoteKind = "resonance" | "thought" | "question" | "goal" | "pet" | "streak";
export interface Note {
  id: string;
  kind: NoteKind;
  en: string;
  ru: string;
  ts: number;
  read: boolean;
  href?: string;
}
interface Snap {
  notes: Note[];
  alerts: boolean; // system notifications enabled and allowed
  supported: boolean;
}

const MAX = 30;
const ALERTS_KEY = "synnod-notes-alerts";
let mode: "live" | "demo" | null = null;
let notes: Note[] = [];
let snap: Snap = { notes: [], alerts: false, supported: false };
const listeners = new Set<() => void>();
const keyOf = () => (mode === "demo" ? "synnod-notes-demo" : "synnod-notes");

function alertsOn(): boolean {
  try {
    return typeof Notification !== "undefined" && Notification.permission === "granted" && window.localStorage.getItem(ALERTS_KEY) === "on";
  } catch {
    return false;
  }
}
function rebuild() {
  snap = { notes, alerts: alertsOn(), supported: typeof Notification !== "undefined" };
  listeners.forEach((l) => l());
}
function readBook(): Note[] {
  try {
    const raw = window.localStorage.getItem(keyOf());
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}
function load() {
  if (mode) return;
  mode = readDemo() ? "demo" : "live";
  notes = readBook();
  snap = { notes, alerts: alertsOn(), supported: typeof Notification !== "undefined" };
}
function save() {
  try {
    window.localStorage.setItem(keyOf(), JSON.stringify(notes));
  } catch {
    /* ignore */
  }
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const EMPTY: Snap = { notes: [], alerts: false, supported: false };
export const useNotes = () =>
  useSyncExternalStore(
    subscribe,
    () => {
      load();
      return snap;
    },
    () => EMPTY
  );

export const notifyActions = {
  // `key` makes a note happen only once (the same key is never added twice)
  push(n: { kind: NoteKind; en: string; ru: string; href?: string; key?: string }) {
    load();
    const id = n.key ?? `${n.kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (notes.some((x) => x.id === id)) return false;
    notes = [{ id, kind: n.kind, en: n.en, ru: n.ru, href: n.href, ts: Date.now(), read: false }, ...notes].slice(0, MAX);
    save();
    if (snap.alerts && typeof document !== "undefined" && document.hidden) {
      try {
        const ru = typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("ru");
        new Notification("SYNNOD", { body: ru ? n.ru : n.en, tag: id });
      } catch {
        /* the browser refused */
      }
    }
    rebuild();
    return true;
  },
  markAllRead() {
    load();
    if (!notes.some((n) => !n.read)) return;
    notes = notes.map((n) => ({ ...n, read: true }));
    save();
    rebuild();
  },
  clear() {
    load();
    notes = [];
    save();
    rebuild();
  },
  setMode(next: "live" | "demo") {
    load();
    if (next === mode) return;
    mode = next;
    notes = readBook();
    rebuild();
  },
  // Ask the browser for permission to show system notifications (needs a click).
  async enableAlerts() {
    load();
    if (typeof Notification === "undefined") return false;
    try {
      const p = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      window.localStorage.setItem(ALERTS_KEY, p === "granted" ? "on" : "off");
    } catch {
      /* ignore */
    }
    rebuild();
    return alertsOn();
  },
  disableAlerts() {
    try {
      window.localStorage.setItem(ALERTS_KEY, "off");
    } catch {
      /* ignore */
    }
    rebuild();
  },
};
