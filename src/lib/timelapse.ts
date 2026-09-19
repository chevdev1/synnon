// Timelapse: the mind's recent history as a list of timed events (who claimed,
// who spoke, which thoughts grew from which cells). Only cell numbers and
// timestamps: no text ever leaves the server through this.
export interface TlEvent {
  t: number; // ms
  type: "claim" | "voice" | "thought";
  node: number;
  links?: number[]; // thoughts: the other cells that fed it
}

export interface Timelapse {
  from: number;
  to: number;
  range: "24h" | "all";
  pre: number[]; // cells already taken when the range starts
  events: TlEvent[]; // oldest first
}

export const MIN_EVENTS = 3;

// A deterministic simulated day for the demo: 40 voices, a few claims and thoughts.
export function demoTimelapse(now: number, cellIds: number[]): Timelapse {
  const from = now - 24 * 3600_000;
  const pre = cellIds.filter((id) => id % 3 === 0 || id % 4 === 0).slice(0, 40);
  const fresh = cellIds.filter((id) => !pre.includes(id) && id % 5 === 1).slice(0, 8);
  const events: TlEvent[] = [];
  const span = now - from;
  fresh.forEach((id, i) => events.push({ t: from + span * (0.06 + i * 0.11), type: "claim", node: id }));
  for (let i = 0; i < 42; i++) {
    const pool = [...pre, ...fresh];
    events.push({ t: from + span * (0.02 + (i / 42) * 0.96) + ((i * 7919) % 900) * 1000, type: "voice", node: pool[(i * 7 + 3) % pool.length] });
  }
  for (let i = 0; i < 7; i++) {
    const pool = [...pre, ...fresh];
    const a = pool[(i * 11 + 1) % pool.length];
    const links = [pool[(i * 5 + 2) % pool.length], pool[(i * 13 + 7) % pool.length]].filter((x) => x !== a);
    events.push({ t: from + span * (0.12 + i * 0.13), type: "thought", node: a, links });
  }
  events.sort((x, y) => x.t - y.t);
  return { from, to: now, range: "24h", pre, events };
}
