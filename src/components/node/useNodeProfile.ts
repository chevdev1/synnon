"use client";

import { useEffect, useState } from "react";
import { useLive } from "@/lib/live/context";
import { demoProfile, type NodeProfile } from "@/lib/nodeProfile";

type State = { id: number | null; profile: NodeProfile | null; error: string | null };

// Real mode: GET /api/nodes/:id. Demo mode: a deterministic, clearly simulated history.
export function useNodeProfile(id: number | null): { profile: NodeProfile | null; loading: boolean; error: string | null } {
  const { mode, offline, nodes } = useLive();
  const [state, setState] = useState<State>({ id: null, profile: null, error: null });
  const node = id == null ? undefined : nodes.find((n) => n.id === id);
  const status = node?.status;
  const owner = node?.ownerName ?? null;

  useEffect(() => {
    if (id == null) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (mode === "demo") {
        setState({ id, profile: demoProfile(id, status ?? "available", owner, Date.now()), error: null });
        return;
      }
      if (offline) {
        setState({ id, profile: null, error: "The live backend isn't connected." });
        return;
      }
      fetch(`/api/nodes/${id}`, { cache: "no-store" })
        .then(async (r) => {
          if (!r.ok) throw new Error(r.status === 404 ? "No such node." : "Couldn't load this node.");
          return (await r.json()) as NodeProfile;
        })
        .then((profile) => !cancelled && setState({ id, profile, error: null }))
        .catch((e: Error) => !cancelled && setState({ id, profile: null, error: e.message }));
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // status/owner change when the node is claimed or goes quiet: refresh the profile then too
  }, [id, mode, offline, status, owner]);

  const ready = state.id === id;
  return { profile: ready ? state.profile : null, loading: id != null && !ready, error: ready ? state.error : null };
}
