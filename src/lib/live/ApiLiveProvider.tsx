"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { BrainNode, NodeStatus, PulseEvent } from "@/lib/brain/types";
import {
  iconForNode,
  LiveContext,
  type Character,
  type LiveContextValue,
  type LiveEvent,
  type LiveMemory,
  type Me,
  type Stats,
  type Thought,
} from "./context";
import { walletSignIn } from "@/lib/wallet";
import { sfx } from "@/lib/sfx";

// Real data only: everything shown comes from /api/* and the SSE stream. If
// nothing has happened yet the UI says so instead of inventing activity.

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

async function post(url: string, body?: unknown) {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data: Record<string, unknown> = {};
    try {
      data = (await r.json()) as Record<string, unknown>;
    } catch {
      /* empty body */
    }
    return { status: r.status, data };
  } catch {
    return { status: 0, data: { error: "network error" } as Record<string, unknown> };
  }
}

const label = (id: number) => String(id).padStart(2, "0");
let eventSeq = 0;

interface ApiNode {
  id: number;
  status: string;
  ownerName?: string | null;
  lastActiveAt?: number | null;
}
interface ApiMemory {
  id: number;
  nodeId: number | null;
  title: string;
  createdAt: string;
}

export function ApiLiveProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] = useState<BrainNode[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [memories, setMemories] = useState<LiveMemory[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pulseEvent, setPulseEvent] = useState<PulseEvent | null>(null);
  const [activitySeries, setActivitySeries] = useState<number[]>(() => Array(24).fill(8));
  const [now, setNow] = useState(() => Date.now());
  const [offline, setOffline] = useState(false);
  const eventTimes = useRef<number[]>([]);

  const refreshNodes = useCallback(async () => {
    const d = await getJson<{ nodes: ApiNode[] }>("/api/nodes");
    setOffline(!d);
    if (d) setNodes(d.nodes.map((n) => ({ id: n.id, status: n.status as NodeStatus, label: `Node ${label(n.id)}`, ownerName: n.ownerName ?? undefined, lastActiveAt: n.lastActiveAt ?? undefined })));
  }, []);
  const refreshMe = useCallback(async () => {
    const d = await getJson<{ user: { username: string; wallet?: string | null } | null; nodeId?: number | null }>("/api/auth/me");
    setMe(d?.user ? { name: d.user.username, wallet: d.user.wallet ?? null, nodeId: d.nodeId ?? null } : null);
  }, []);
  const refreshMemory = useCallback(async () => {
    const d = await getJson<{ items: ApiMemory[] }>("/api/memory?tab=recent");
    if (d)
      setMemories(
        d.items.map((m) => ({
          id: m.id,
          icon: iconForNode(m.nodeId ?? 0),
          title: m.title,
          nodeId: m.nodeId ?? 0,
          ts: new Date(m.createdAt).getTime(),
        }))
      );
  }, []);

  const bump = useCallback((text: string, nodeId: number) => {
    eventSeq += 1;
    const id = eventSeq; // capture now: the updater below runs later
    const ts = Date.now();
    eventTimes.current.push(ts);
    setEvents((prev) => [{ id, nodeId, text, ts }, ...prev].slice(0, 4));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initial = setTimeout(() => {
      void refreshNodes();
      void refreshMe();
      void refreshMemory();
      void getJson<Character>("/api/character").then((c) => !cancelled && c && setCharacter(c));
      void getJson<{ thoughts: { id: number; text: string; createdAt: string }[] }>("/api/thoughts").then(
        (d) => !cancelled && d && setThoughts(d.thoughts.map((t) => ({ id: t.id, text: t.text, ts: new Date(t.createdAt).getTime() })))
      );
    }, 0);
    // Server settles quiet "active" nodes into "memory" on read, so re-read now and then.
    const poll = setInterval(() => void refreshNodes(), 30_000);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [refreshNodes, refreshMe, refreshMemory]);

  useEffect(() => {
    if (offline) return; // no backend: don't hammer a failing endpoint
    const es = new EventSource("/api/stream");
    es.addEventListener("node.updated", (e) => {
      const d = JSON.parse((e as MessageEvent).data) as ApiNode;
      setNodes((cur) => cur.map((n) => (n.id === d.id ? { ...n, status: d.status as NodeStatus, lastActiveAt: d.status === "active" ? Date.now() : n.lastActiveAt } : n)));
      if (d.status === "claimed") {
        bump(`node ${label(d.id)} was claimed`, d.id);
        setPulseEvent({ nodeId: d.id, type: "claim" }); // shockwave across the brain
        sfx.claim();
        void refreshNodes(); // owner name for the new cell
      }
    });
    es.addEventListener("output.created", (e) => {
      const d = JSON.parse((e as MessageEvent).data) as { nodeId: number | null };
      if (d.nodeId != null) {
        setPulseEvent({ nodeId: d.nodeId, type: "output" });
        bump(`node ${label(d.nodeId)} left a memory`, d.nodeId);
      }
      void refreshMemory();
    });
    es.addEventListener("thought.created", (e) => {
      const d = JSON.parse((e as MessageEvent).data) as { id: number; text: string; createdAt: string; nodeIds?: number[] };
      setThoughts((prev) => [{ id: d.id, text: d.text, ts: new Date(d.createdAt).getTime() }, ...prev].slice(0, 8));
      bump("a new thought surfaced", 0);
      // The thought grew out of these cells' words: sparks travel between them.
      if (d.nodeIds && d.nodeIds.length > 1) setPulseEvent({ nodeId: d.nodeIds[0], type: "thought", links: d.nodeIds.slice(1) });
    });
    return () => es.close();
  }, [bump, refreshMemory, refreshNodes, offline]);

  // Sparkline = real event rate over the last minute, not a random walk.
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - 60_000;
      eventTimes.current = eventTimes.current.filter((t) => t > cutoff);
      const level = Math.min(70, 8 + eventTimes.current.length * 16);
      setActivitySeries((prev) => [...prev.slice(1), level]);
    }, 2200);
    return () => clearInterval(id);
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

  const triggerPulse = useCallback((nodeId: number) => setPulseEvent({ nodeId, type: "output" }), []);

  const signIn = useCallback<LiveContextValue["signIn"]>(
    async (name) => {
      const r = await post("/api/auth/guest", { name });
      if (r.status !== 201) return { ok: false, error: String(r.data.error ?? "could not sign in") };
      await refreshMe();
      return { ok: true };
    },
    [refreshMe]
  );

  const signInWithWallet = useCallback<LiveContextValue["signInWithWallet"]>(
    async (chain) => {
      const r = await walletSignIn(chain);
      if (r.ok) await Promise.all([refreshMe(), refreshNodes()]);
      return r;
    },
    [refreshMe, refreshNodes]
  );

  const claim = useCallback<LiveContextValue["claim"]>(
    async (nodeId) => {
      const r = await post(`/api/nodes/${nodeId}/claim`);
      if (r.status !== 200) return { ok: false, error: String(r.data.error ?? "could not claim") };
      await Promise.all([refreshNodes(), refreshMe()]);
      setSelectedId(nodeId); // the shockwave + sound come from the server's node.updated event
      return { ok: true };
    },
    [refreshNodes, refreshMe]
  );

  const speak = useCallback<LiveContextValue["speak"]>(
    async (text) => {
      if (!me?.nodeId) return { ok: false, error: "claim a node first" };
      const r = await post("/api/scenarios", { nodeId: me.nodeId, text });
      if (r.status === 201) {
        const out = r.data.output as { text: string } | null;
        return out ? { ok: true, reply: out.text } : { ok: false, error: "no reply" };
      }
      if (r.status === 202) {
        // Your message is always saved; only the reply is missing.
        if (r.data.reason === "error") {
          return { ok: false, quiet: true, error: "Saved. The AI service didn't answer just now (rate limit or a short outage). Try again in a minute." };
        }
        const dev = process.env.NODE_ENV !== "production";
        return {
          ok: false,
          quiet: true,
          error: dev
            ? "Saved. No AI is connected yet: add LLM_API_KEY to .env.local (a free key from aistudio.google.com/apikey works), then send again."
            : "Saved. The mind is quiet right now, so it can't answer yet.",
        };
      }
      return { ok: false, error: String(r.data.error ?? "something went wrong") };
    },
    [me]
  );

  const logout = useCallback(async () => {
    await post("/api/auth/logout");
    await refreshMe();
  }, [refreshMe]);

  const lastMemoryTs = memories[0]?.ts ?? null;

  const value = useMemo<LiveContextValue>(
    () => ({
      mode: "api",
      offline,
      nodes,
      me,
      currentUserNodeId: me?.nodeId ?? null,
      selectedId,
      setSelectedId,
      pulseEvent,
      triggerPulse,
      stats,
      activitySeries,
      now,
      lastMemoryTs,
      thoughts,
      events,
      memories,
      character,
      signIn,
      signInWithWallet,
      claim,
      speak,
      logout,
    }),
    [offline, nodes, me, selectedId, pulseEvent, triggerPulse, stats, activitySeries, now, lastMemoryTs, thoughts, events, memories, character, signIn, signInWithWallet, claim, speak, logout]
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
