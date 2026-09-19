"use client";

import { LiveRoot } from "@/lib/live/LiveRoot";
import { useNodeProfile } from "@/components/node/useNodeProfile";
import AnimatedCard from "./AnimatedCard";

function Inner({ id, autoRecord }: { id: number; autoRecord: boolean }) {
  const { profile, error } = useNodeProfile(id);
  return (
    <div className="mx-auto w-full max-w-[1200px] p-3">
      {profile ? <AnimatedCard profile={profile} autoRecord={autoRecord} /> : <p className="font-head text-[9px] uppercase text-[var(--muted)]">{error ?? "loading…"}</p>}
    </div>
  );
}

export default function CardPage({ id, autoRecord }: { id: number; autoRecord: boolean }) {
  return (
    <LiveRoot>
      <Inner id={id} autoRecord={autoRecord} />
    </LiveRoot>
  );
}
