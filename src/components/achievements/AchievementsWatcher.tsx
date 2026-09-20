"use client";

import { useEffect, useRef, useState } from "react";
import { ACH_BY_ID, derive, isDone } from "@/lib/achievements";
import { achActions, useAch } from "@/lib/achStore";
import { questActions } from "@/lib/questStore";
import { useHelp } from "@/lib/help";
import { useLive } from "@/lib/live/context";
import { useMind } from "@/lib/mind";
import { demoProfile, type NodeProfile } from "@/lib/nodeProfile";
import { useTod } from "@/lib/tod";

// Watches the landing page and awards achievements: the ones computed from real data
// (wallet linked, cell claimed, voices, thoughts...) and the ones earned by doing things
// (a night visit, seeing the mind sleep, all four times of day...).
export default function AchievementsWatcher() {
  const { mode, me, nodes, currentUserNodeId, pulseEvent } = useLive();
  const { state: mindState } = useMind();
  const { phase } = useTod();
  const help = useHelp();
  const { unlocked } = useAch();
  const [profile, setProfile] = useState<NodeProfile | null>(null);
  const [tick, setTick] = useState(0);
  const status = nodes.find((n) => n.id === currentUserNodeId)?.status;
  const owner = nodes.find((n) => n.id === currentUserNodeId)?.ownerName ?? null;

  // Demo and live keep separate achievement books.
  useEffect(() => {
    achActions.setMode(mode === "demo" ? "demo" : "live");
    questActions.setMode(mode === "demo" ? "demo" : "live");
  }, [mode]);

  // First light + night owl, once the visitor is past the intro screen.
  useEffect(() => {
    const go = () => {
      achActions.unlock("first-light");
      const h = new Date().getHours();
      if (h >= 2 && h < 5) achActions.unlock("night-owl");
    };
    let entered = false;
    try {
      entered = window.sessionStorage.getItem("synnod-entered") === "1";
    } catch {
      /* ignore */
    }
    if (entered) {
      const t = window.setTimeout(go, 900);
      return () => window.clearTimeout(t);
    }
    window.addEventListener("synnod:entered", go, { once: true });
    return () => window.removeEventListener("synnod:entered", go);
  }, []);

  useEffect(() => {
    achActions.noteTod(phase);
  }, [phase]);

  // Sleepwalker: you were here while the mind was awake and watched it doze off
  // (a young site that is simply asleep when you arrive doesn't count).
  const sawAwake = useRef(false);
  useEffect(() => {
    if (mindState !== "sleeping") {
      sawAwake.current = true;
      return;
    }
    if (!sawAwake.current) return;
    const t = window.setTimeout(() => achActions.unlock("sleepwalker"), 4000);
    return () => window.clearTimeout(t);
  }, [mindState]);

  useEffect(() => {
    if (pulseEvent?.type === "claim" && pulseEvent.nodeId !== currentUserNodeId && !achActions.recentOwnClaim()) achActions.unlock("witness");
    if (pulseEvent && pulseEvent.nodeId === currentUserNodeId) setTimeout(() => setTick((n) => n + 1), 1500); // own voice: recount
  }, [pulseEvent, currentUserNodeId]);

  useEffect(() => {
    if (help.on) achActions.unlock("asked-directions");
  }, [help.on]);

  // This visitor's own cell numbers (real API, or the simulated profile in the demo).
  useEffect(() => {
    if (currentUserNodeId == null) return;
    let cancelled = false;
    const load = () => {
      if (mode === "demo") {
        setProfile(demoProfile(currentUserNodeId, status ?? "active", owner, Date.now()));
        return;
      }
      fetch(`/api/nodes/${currentUserNodeId}`, { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<NodeProfile>) : null))
        .then((p) => !cancelled && p && setProfile(p))
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [mode, currentUserNodeId, status, owner, tick]);

  // Award everything the data says is done. Several at once (a fresh browser for an old
  // account) become one "progress restored" note instead of a wall of pop-ups.
  useEffect(() => {
    const cur = derive({ me, profile: currentUserNodeId == null ? null : profile });
    const newly: string[] = [];
    for (const [id, v] of Object.entries(cur)) {
      const a = ACH_BY_ID.get(id);
      if (!a) continue;
      achActions.record(id, v);
      if (isDone(a, v) && !unlocked[id]) newly.push(id);
    }
    if (mode === "demo") {
      // The simulated "you" already has a cell and a history: record it quietly.
      // (Use the trophy panel to preview the pop-ups.)
      newly.forEach((id) => achActions.unlock(id, { silent: true }));
    } else if (newly.length >= 3) {
      newly.forEach((id) => achActions.unlock(id, { silent: true }));
      achActions.restored(newly.length);
    } else newly.forEach((id) => achActions.unlock(id));
  }, [mode, me, profile, currentUserNodeId, unlocked]);

  return null;
}
