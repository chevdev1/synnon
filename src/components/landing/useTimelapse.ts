"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BrainNode, PulseEvent } from "@/lib/brain/types";
import { useLive } from "@/lib/live/context";
import { demoTimelapse, MIN_EVENTS, type Timelapse } from "@/lib/timelapse";

const DURATION_MS = 22_000; // the whole range plays in about this long at 1x

export type TlPhase = "idle" | "loading" | "empty" | "error" | "playing" | "paused" | "done";

export interface TlView {
  phase: TlPhase;
  progress: number; // 0..1
  clock: number; // virtual time (ms)
  span: number; // how much real time is being replayed (ms)
  counts: { claims: number; voices: number; thoughts: number };
  speed: number;
}

const IDLE: TlView = { phase: "idle", progress: 0, clock: 0, span: 0, counts: { claims: 0, voices: 0, thoughts: 0 }, speed: 1 };

// Replays the mind's recent history on the brain, compressed to ~22 seconds:
// cells appear when they were claimed, flash when they spoke, and sparks jump
// between the cells behind each thought. The brain's status layers only change
// on claims (rebuilding them is the expensive step); speaking is shown with the
// cheap glow overlay, which cools in seconds here instead of hours.
export function useTimelapse(warp = false) {
  const { mode, nodes } = useLive();
  const [view, setView] = useState<TlView>(IDLE);
  const [tlNodes, setTlNodes] = useState<BrainNode[] | null>(null);
  const [tlPulse, setTlPulse] = useState<PulseEvent | null>(null);
  const run = useRef({ raf: 0, data: null as Timelapse | null, i: 0, elapsed: 0, last: 0, paused: false, speed: 1, status: new Map<number, BrainNode>(), counts: { claims: 0, voices: 0, thoughts: 0 } });

  const stop = useCallback(() => {
    cancelAnimationFrame(run.current.raf);
    run.current.data = null;
    setTlNodes(null);
    setTlPulse(null);
    setView(IDLE);
  }, []);

  useEffect(() => () => cancelAnimationFrame(run.current.raf), []);

  const begin = useCallback(
    (data: Timelapse) => {
      const r = run.current;
      r.data = data;
      r.i = 0;
      r.elapsed = 0;
      r.paused = false;
      r.counts = { claims: 0, voices: 0, thoughts: 0 };
      r.status = new Map(nodes.map((n) => [n.id, { id: n.id, status: data.pre.includes(n.id) ? "memory" : "available", label: n.label }]));
      setTlNodes([...r.status.values()]);
      setView({ phase: "playing", progress: 0, clock: data.from, span: data.to - data.from, counts: { ...r.counts }, speed: r.speed });
      r.last = performance.now();
      let lastView = 0;

      const frame = (t: number) => {
        const d = r.data;
        if (!d) return;
        const dt = t - r.last;
        r.last = t;
        if (!r.paused) r.elapsed += dt * r.speed;
        const p = Math.min(1, r.elapsed / DURATION_MS);
        let changed = false;
        let pulse: PulseEvent | null = null;
        while (r.i < d.events.length && (d.events[r.i].t - d.from) / (d.to - d.from) <= p) {
          const e = d.events[r.i++];
          const cur = r.status.get(e.node);
          if (e.type === "claim") {
            r.counts.claims++;
            if (cur && cur.status === "available") {
              r.status.set(e.node, { ...cur, status: "memory" });
            }
            pulse = { nodeId: e.node, type: "claim" };
          } else if (e.type === "voice") {
            r.counts.voices++;
            pulse = { nodeId: e.node, type: "output" };
          } else {
            r.counts.thoughts++;
            pulse = { nodeId: e.node, type: "thought", links: e.links };
          }
          if (cur && e.type !== "thought") r.status.set(e.node, { ...(r.status.get(e.node) ?? cur), lastActiveAt: Date.now() });
          changed = true;
        }
        if (changed) {
          setTlNodes([...r.status.values()]);
          if (pulse) setTlPulse(pulse);
        }
        if (t - lastView > 80 || p >= 1) {
          lastView = t;
          setView((v) => ({ ...v, phase: p >= 1 ? "done" : r.paused ? "paused" : "playing", progress: p, clock: d.from + p * (d.to - d.from), counts: { ...r.counts }, speed: r.speed }));
        }
        if (p < 1) r.raf = requestAnimationFrame(frame);
      };
      r.raf = requestAnimationFrame(frame);
    },
    [nodes]
  );

  const start = useCallback(async () => {
    cancelAnimationFrame(run.current.raf);
    setView({ ...IDLE, phase: "loading" });
    try {
      let data: Timelapse;
      if (mode === "demo") {
        data = demoTimelapse(Date.now(), nodes.map((n) => n.id));
      } else {
        const r = await fetch("/api/timelapse", { cache: "no-store" });
        if (!r.ok) throw new Error("timelapse unavailable");
        data = (await r.json()) as Timelapse;
      }
      if (data.events.length < MIN_EVENTS) {
        setView({ ...IDLE, phase: "empty" });
        return;
      }
      begin(data);
    } catch {
      setView({ ...IDLE, phase: "error" });
    }
  }, [mode, nodes, begin]);

  const togglePause = useCallback(() => {
    const r = run.current;
    if (!r.data) return;
    if (view.phase === "done") return begin(r.data);
    r.paused = !r.paused;
    setView((v) => ({ ...v, phase: r.paused ? "paused" : "playing" }));
  }, [view.phase, begin]);

  const cycleSpeed = useCallback(() => {
    const r = run.current;
    // 1x -> 2x -> 4x, and 8x too when the Comet companion is along ("Warp")
    r.speed = r.speed === 1 ? 2 : r.speed === 2 ? 4 : r.speed === 4 && warp ? 8 : 1;
    setView((v) => ({ ...v, speed: r.speed }));
  }, [warp]);

  return { view, tlNodes, tlPulse, start, stop, togglePause, cycleSpeed, active: view.phase !== "idle" };
}
