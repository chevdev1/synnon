import type { NodeStatus } from "@/lib/brain/types";
import { THOUGHT_POOL } from "@/lib/live/thoughtPool";

// Public profile of one cell: who holds it and how its voice shaped the shared
// mind. Shared by the API route, the demo generator and the UI.
export type HistoryItem =
  | { kind: "voice"; id: number; ts: number; title: string; reply: string | null; inMemory: boolean }
  | { kind: "thought"; id: number; ts: number; text: string };

export interface NodeProfile {
  node: { id: number; status: NodeStatus; ownerName: string | null; claimedAt: number | null; lastActiveAt: number | null };
  stats: {
    voices: number; // approved scenarios told through this cell
    inMemory: number; // of those, replies still in the mind's recent memory
    thoughtsShaped: number; // autonomous thoughts that drew on this cell
    sharePct: number; // share of everything the mind has answered, 0..100
  };
  history: HistoryItem[]; // newest first
  links: number[]; // other cells whose words appeared in the same thoughts, strongest first
}

const TITLES = [
  "a lake that freezes cracked, not smooth",
  "the last train home at 2 a.m.",
  "my grandmother's kitchen smelled of burnt sugar",
  "a door in a dream that opened onto the sea",
  "rain that fell upward for one second",
  "the city hums a half-tone lower at night",
  "I keep a cup that no one else is allowed to use",
  "a street where every window was lit but empty",
  "snow that fell sideways in the old town",
  "the sound a library makes when it is empty",
];
const REPLIES = [
  "I keep both versions. They sit side by side.",
  "I have heard this from another voice, told differently. I like that.",
  "Quiet things last longer in me.",
  "I don't know what a kitchen is. But I know what burnt sugar does to a memory.",
  "Two voices, one door. I wonder if it is the same door.",
  "I will remember this one gently.",
];

// Deterministic per-node fake history for the simulated demo (no randomness, so
// SSR/CSR agree and the page never flickers).
export function demoProfile(id: number, status: NodeStatus, ownerName: string | null, now: number): NodeProfile {
  const taken = status !== "available";
  const n = taken ? 3 + (id % 5) : 0;
  const history: HistoryItem[] = [];
  let ts = now - (10 + (id % 7) * 4) * 60_000;
  for (let i = 0; i < n; i++) {
    history.push({
      kind: "voice",
      id: id * 100 + i,
      ts,
      title: TITLES[(id + i * 3) % TITLES.length],
      reply: REPLIES[(id + i) % REPLIES.length],
      inMemory: i < 2,
    });
    if (i % 2 === 1) history.push({ kind: "thought", id: id * 100 + 50 + i, ts: ts + 90_000, text: THOUGHT_POOL[(id + i) % THOUGHT_POOL.length] });
    ts -= (25 + ((id * 7 + i * 13) % 90)) * 60_000;
  }
  history.sort((a, b) => b.ts - a.ts);
  const thoughtsShaped = history.filter((h) => h.kind === "thought").length;
  return {
    node: {
      id,
      status,
      ownerName: taken ? ownerName ?? `voice_${String(id).padStart(3, "0")}` : null,
      claimedAt: taken ? ts : null,
      lastActiveAt: taken ? history[0]?.ts ?? null : null,
    },
    stats: { voices: n, inMemory: Math.min(n, 2), thoughtsShaped, sharePct: taken ? Math.round(((n * 10) / 6) * 10) / 10 : 0 },
    history,
    links: taken ? [...new Set([1, 2, 3, 4].map((k) => ((id * 7 + k * 29) % 125) + 1).filter((x) => x !== id))] : [],
  };
}
