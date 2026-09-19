"use client";

import { useSyncExternalStore } from "react";
import { useLive } from "@/lib/live/context";

// What the mind is "doing" right now. Feeds the pixel face, the dream mode and
// the character card. Nothing here invents AI text: it only reads state.
export type MindState = "sleeping" | "thinking" | "speaking" | "awake";

export const MOODS = ["curious", "watching", "listening", "wondering", "restless"] as const;
const SLEEP_AFTER_MS = 6 * 60_000; // no voice for this long → the mind dozes off

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
let thinking = false;
let speakingUntil = 0;
let speakTimer: number | undefined;
let demoMood = 0;
let moodTimer: number | undefined;

export const mindActions = {
  setThinking(v: boolean) {
    thinking = v;
    emit();
  },
  // The reply is being typed out: the face "speaks" for this long.
  speakFor(ms: number) {
    speakingUntil = Date.now() + ms;
    window.clearTimeout(speakTimer);
    speakTimer = window.setTimeout(emit, ms + 30);
    emit();
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (listeners.size === 1) moodTimer = window.setInterval(() => ((demoMood = (demoMood + 1) % MOODS.length), emit()), 5200);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.clearInterval(moodTimer);
  };
}

// `snapshot` is a string so React can compare it by value.
const snapshot = () => `${thinking ? 1 : 0}${Date.now() < speakingUntil ? 1 : 0}${demoMood}`;

const noop = () => () => {};
const urlForce = () => {
  try {
    return new URLSearchParams(window.location.search).get("mind");
  } catch {
    return null;
  }
};

export function useMind(): { state: MindState; mood: string; dreaming: boolean } {
  const { mode, character, lastMemoryTs, now } = useLive();
  const s = useSyncExternalStore(subscribe, snapshot, () => "000");
  const forced = useSyncExternalStore(noop, urlForce, () => null); // ?mind=sleep|think|speak|awake for screenshots

  const idle = lastMemoryTs == null ? Number.POSITIVE_INFINITY : now - lastMemoryTs;
  let state: MindState = "awake";
  if (s[0] === "1") state = "thinking";
  else if (s[1] === "1") state = "speaking";
  else if (idle > SLEEP_AFTER_MS) state = "sleeping";
  if (forced === "sleep") state = "sleeping";
  else if (forced === "think") state = "thinking";
  else if (forced === "speak") state = "speaking";
  else if (forced === "awake") state = "awake";

  const mood = mode === "demo" ? MOODS[Number(s.slice(2)) % MOODS.length] : (character?.mood ?? "curious");
  return { state, mood, dreaming: state === "sleeping" };
}
