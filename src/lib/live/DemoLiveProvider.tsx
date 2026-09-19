"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MOCK_NODES, CURRENT_USER_NODE_ID, THOUGHTS as INITIAL_THOUGHTS, ACTIVITY_SERIES, CHARACTER } from "@/lib/mock/data";
import { THOUGHT_POOL } from "./thoughtPool";
import type { BrainNode, PulseEvent } from "@/lib/brain/types";
import { LiveContext, type LiveContextValue, type LiveEvent, type LiveMemory, type Stats, type Thought } from "./context";

// Everything here is SIMULATED, for showing the interface with life in it.
// It is clearly badged as DEMO in the header and never touches the API.

const MEMORY_TITLES: { icon: LiveMemory["icon"]; title: string }[] = [
  { icon: "rain", title: "Rain on a window that isn't there" },
  { icon: "city", title: "A staircase that ends in a market" },
  { icon: "cup", title: "Tea gone cold in someone's dream" },
  { icon: "galaxy", title: "A galaxy the shape of a hand" },
  { icon: "eye", title: "An eye painted inside a clock" },
  { icon: "city", title: "Streets that rearrange at night" },
  { icon: "rain", title: "The smell before a storm, remembered" },
];

const REPLIES = [
  "I kept that. it sits next to something someone else said yesterday.",
  "hm. three other voices touched that same thing. none of them agreed.",
  "I don't know if I understand it. I'll hold it anyway.",
  "that changed the color of something. I'm not sure what yet.",
  "say more? I only have the edges of it.",
];

const DEMO_CHARACTER = { traits: CHARACTER.traits, quote: CHARACTER.quote, mood: "curious" };

let thoughtIdSeq = 1000;
let eventSeq = 0;

export function DemoLiveProvider({ children }: { children: ReactNode }) {
  // Cells that have spoken start with a spread of "last active" times, so the glow-by-age shows.
  const [nodes, setNodes] = useState<BrainNode[]>(() =>
    MOCK_NODES.map((n) => {
      const owner = n.status === "available" ? undefined : `voice_${String(n.id).padStart(3, "0")}`; // simulated holders, same names as their demo profiles
      return n.status === "available" || n.status === "claimed" ? { ...n, ownerName: owner } : { ...n, ownerName: owner, lastActiveAt: Date.now() - ((n.id * 37) % 180) * 60_000 };
    })
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pulseEvent, setPulseEvent] = useState<PulseEvent | null>(null);
  const [activitySeries, setActivitySeries] = useState<number[]>(ACTIVITY_SERIES);
  const [thoughts, setThoughts] = useState<Thought[]>(() =>
    INITIAL_THOUGHTS.map((t, i) => ({ id: t.id, text: t.text, ts: Date.now() - (i + 1) * 18 * 60 * 1000 }))
  );
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [memories, setMemories] = useState<LiveMemory[]>([]);
  const [lastMemoryTs, setLastMemoryTs] = useState<number | null>(() => Date.now() - 90 * 1000);
  const [now, setNow] = useState(() => Date.now());
  const replyIdx = useRef(0);

  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  const usedThoughtsRef = useRef<Set<string>>(new Set(INITIAL_THOUGHTS.map((t) => t.text)));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const scheduleNext = (delay: number) => timeouts.push(setTimeout(tick, delay));

    function tick() {
      if (cancelled) return;
      const candidates = nodesRef.current.filter(
        (n) => n.id !== CURRENT_USER_NODE_ID && (n.status === "available" || n.status === "claimed")
      );
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const label = String(pick.id).padStart(2, "0");
        if (pick.status === "available" && Math.random() < 0.45) {
          // a new voice takes a free cell: shockwave across the brain
          setNodes((cur) => cur.map((n) => (n.id === pick.id ? { ...n, status: "claimed", ownerName: `voice_${String(n.id).padStart(3, "0")}`, lastActiveAt: Date.now() } : n)));
          setPulseEvent({ nodeId: pick.id, type: "claim" });
          eventSeq += 1;
          const claimed: LiveEvent = { id: eventSeq, nodeId: pick.id, text: `node ${label} was claimed`, ts: Date.now() };
          setEvents((prev) => [claimed, ...prev].slice(0, 4));
          scheduleNext(6000 + Math.random() * 6000);
          return;
        }
        setNodes((cur) => cur.map((n) => (n.id === pick.id ? { ...n, status: "active", lastActiveAt: Date.now() } : n)));
        setPulseEvent({ nodeId: pick.id, type: "output" });
        eventSeq += 1;
        const wake: LiveEvent = { id: eventSeq, nodeId: pick.id, text: `node ${label} is speaking`, ts: Date.now() };
        setEvents((prev) => [wake, ...prev].slice(0, 4));
        timeouts.push(
          setTimeout(() => {
            if (cancelled) return;
            setNodes((cur) => cur.map((n) => (n.id === pick.id ? { ...n, status: "memory" } : n)));
            setLastMemoryTs(Date.now());
            const m = MEMORY_TITLES[Math.floor(Math.random() * MEMORY_TITLES.length)];
            eventSeq += 1;
            const id = eventSeq; // capture now: setState updaters run later, when the counter may have moved on
            const ts = Date.now();
            setEvents((prev) => [{ id, nodeId: pick.id, text: `node ${label} left a memory`, ts }, ...prev].slice(0, 4));
            setMemories((prev) => [{ id, ...m, nodeId: pick.id, ts }, ...prev].slice(0, 6));
          }, 3600)
        );
      }
      scheduleNext(6000 + Math.random() * 6000);
    }
    scheduleNext(4000 + Math.random() * 3000);
    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActivitySeries((prev) => {
        const last = prev[prev.length - 1] ?? 30;
        const next = Math.max(6, Math.min(80, last + (Math.random() * 22 - 11)));
        return [...prev.slice(1), Math.round(next)];
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const scheduleNext = (delay: number) => (timeoutId = setTimeout(tick, delay));
    function tick() {
      if (cancelled) return;
      const unused = THOUGHT_POOL.filter((line) => !usedThoughtsRef.current.has(line));
      const pool = unused.length > 0 ? unused : THOUGHT_POOL;
      const text = pool[Math.floor(Math.random() * pool.length)];
      usedThoughtsRef.current.add(text);
      if (usedThoughtsRef.current.size >= THOUGHT_POOL.length) usedThoughtsRef.current.clear();
      thoughtIdSeq += 1;
      const id = thoughtIdSeq;
      const ts = Date.now();
      setThoughts((prev) => [{ id, text, ts }, ...prev].slice(0, 6));
      // the thought "grows out of" a few voices: sparks travel between their cells
      const spoken = nodesRef.current.filter((n) => n.status !== "available");
      if (spoken.length >= 3) {
        const pickN = [...spoken].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 2));
        setPulseEvent({ nodeId: pickN[0].id, type: "thought", links: pickN.slice(1).map((n) => n.id) });
      }
      scheduleNext(16000 + Math.random() * 9000);
    }
    scheduleNext(9000 + Math.random() * 5000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  const triggerPulse = useCallback((nodeId: number) => {
    setPulseEvent({ nodeId, type: "output" });
    setNodes((cur) => cur.map((n) => (n.id === nodeId ? { ...n, lastActiveAt: Date.now() } : n)));
  }, []);

  const stats = useMemo<Stats>(
    () =>
      nodes.reduce(
        (acc, n) => {
          acc.total += 1;
          if (n.status === "available") acc.available += 1;
          else if (n.status === "claimed") acc.claimed += 1;
          else if (n.status === "memory") acc.memory += 1;
          else acc.active += 1;
          return acc;
        },
        { total: 0, active: 0, memory: 0, claimed: 0, available: 0 }
      ),
    [nodes]
  );

  const value = useMemo<LiveContextValue>(
    () => ({
      mode: "demo",
      offline: false,
      nodes,
      me: { name: "you", nodeId: CURRENT_USER_NODE_ID },
      currentUserNodeId: CURRENT_USER_NODE_ID,
      selectedId,
      setSelectedId,
      pulseEvent,
      triggerPulse,
      injectPulse: setPulseEvent,
      stats,
      activitySeries,
      now,
      lastMemoryTs,
      thoughts,
      events,
      memories,
      character: DEMO_CHARACTER,
      signIn: async () => ({ ok: false, error: "Demo mode: switch the header toggle to Live data to sign in for real." }),
      signInWithWallet: async () => ({ ok: false, error: "Demo mode: switch the header toggle to Live data to connect a wallet." }),
      claim: async () => ({ ok: false, error: "Demo mode: switch the header toggle to Live data to claim a real node." }),
      speak: async () => {
        await new Promise((r) => setTimeout(r, 1500));
        return { ok: true, reply: REPLIES[replyIdx.current++ % REPLIES.length] } as const;
      },
      logout: async () => {},
    }),
    [nodes, selectedId, pulseEvent, triggerPulse, stats, activitySeries, now, lastMemoryTs, thoughts, events, memories]
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
