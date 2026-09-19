"use client";

import { createContext, useContext } from "react";
import type { BrainNode, PulseEvent } from "@/lib/brain/types";

export interface Thought {
  id: number;
  text: string;
  ts: number;
}

export interface LiveEvent {
  id: number;
  nodeId: number;
  text: string;
  ts: number;
}

export interface LiveMemory {
  id: number;
  icon: "rain" | "city" | "cup" | "galaxy" | "eye";
  title: string;
  nodeId: number;
  ts: number;
}

export interface Stats {
  active: number;
  memory: number;
  claimed: number;
  available: number;
  total: number;
}

export interface Me {
  name: string;
  wallet?: string | null;
  nodeId: number | null;
}

export type SpeakResult =
  | { ok: true; reply: string }
  | { ok: false; error: string; quiet?: boolean }; // quiet = kept, but the mind can't answer right now

export interface Character {
  traits: string[];
  mood: string;
  quote: string;
}

export interface LiveContextValue {
  mode: "demo" | "api";
  offline: boolean; // API mode only: the backend/database isn't reachable

  nodes: BrainNode[];
  me: Me | null;
  currentUserNodeId: number | null;
  selectedId: number | null;
  setSelectedId: (id: number | null) => void;
  pulseEvent: PulseEvent | null;
  triggerPulse: (nodeId: number) => void;
  injectPulse: (e: PulseEvent) => void; // local-only visual event (the console's /thought, /claim...); never sent anywhere
  stats: Stats;
  activitySeries: number[];
  now: number;
  lastMemoryTs: number | null;
  thoughts: Thought[];
  events: LiveEvent[];
  memories: LiveMemory[];
  character: Character | null;
  // guest sign-in + actions (refused / canned in demo mode)
  signIn: (name: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signInWithWallet: (chain: "evm" | "sol") => Promise<{ ok: true } | { ok: false; error: string }>;
  claim: (nodeId: number) => Promise<{ ok: true } | { ok: false; error: string }>;
  speak: (text: string) => Promise<SpeakResult>;
  logout: () => Promise<void>;
}

export const LiveContext = createContext<LiveContextValue | null>(null);

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used within a live provider");
  return ctx;
}

export const MEMORY_ICONS: LiveMemory["icon"][] = ["rain", "city", "cup", "galaxy", "eye"];
export const iconForNode = (nodeId: number): LiveMemory["icon"] => MEMORY_ICONS[nodeId % MEMORY_ICONS.length];
