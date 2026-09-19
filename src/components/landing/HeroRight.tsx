"use client";

import { Card, CardTitle, StatusDot } from "@/components/ui/Card";
import { PixelCity, PixelWorld } from "@/components/ui/PixelArt";
import Typewriter from "@/components/ui/Typewriter";
import { CURRENT_NODE, MANIFESTO_LINES } from "@/lib/mock/data";
import { useLive } from "@/lib/live/context";
import Link from "next/link";
import { useEffect, useState } from "react";
import { openClaim } from "./ClaimDialog";

function useSessionClock(startMinutes: number) {
  const [secs, setSecs] = useState(startMinutes * 60);
  useEffect(() => {
    const id = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export default function HeroRight() {
  const { mode, me, nodes, currentUserNodeId } = useLive();
  const status = nodes.find((n) => n.id === currentUserNodeId)?.status ?? CURRENT_NODE.status;
  const clock = useSessionClock(2 * 60 + 34);
  const demo = mode === "demo";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <Card help="mind" className="flex min-h-0 flex-1 flex-col overflow-y-auto" id="mind">
        <CardTitle>The mind</CardTitle>
        <div className="mt-3 flex flex-1 items-center gap-3">
          <p className="min-w-0 flex-1 text-[17px] leading-snug text-[var(--text-2)]">
            <Typewriter lines={MANIFESTO_LINES} />
          </p>
          <PixelWorld scale={2} className="shrink-0 rounded-[2px] border-2 border-[var(--border)] transition-transform duration-300 group-hover:scale-[1.04]" />
        </div>
        <Link
          href="/docs#what"
          className="font-head mt-2 inline-block w-fit shrink-0 text-[8px] uppercase text-[var(--link)] transition-colors hover:text-[var(--lime)]"
        >
          Read more →
        </Link>
      </Card>

      <Card help="node" className="shrink-0">
        {currentUserNodeId == null ? (
          <>
            <div className="font-head flex items-center gap-1.5 text-[8px] uppercase text-[var(--text-2)]">
              <span className="h-[6px] w-[6px] bg-[var(--faint)]" />
              <span>{me ? "no node yet" : "not signed in"}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <PixelCity scale={2} className="shrink-0 opacity-60" />
              <p className="text-[16px] leading-snug text-[var(--text-2)]">
                {me ? "Pick a free cell on the brain and claim it." : "Sign in, then claim a cell — it becomes your voice."}
              </p>
            </div>
            <button
              type="button"
              onClick={openClaim}
              className="pixel-btn font-head mt-3 flex h-8 items-center border-2 border-[var(--accent)] px-3 text-[9px] uppercase text-[var(--link)]"
            >
              {me ? "Claim →" : "Sign in →"}
            </button>
          </>
        ) : (
          <>
            <div className="font-head flex items-center gap-1.5 text-[8px] uppercase text-[var(--text-2)]">
              <StatusDot />
              <span>{String(currentUserNodeId).padStart(2, "0")} / online</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <PixelCity scale={2} className="shrink-0" />
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[16px] text-[var(--text-2)]">
                <dt className="text-[var(--muted)]">{demo ? "type" : "voice"}</dt>
                <dd>{demo ? CURRENT_NODE.type : me?.name}</dd>
                <dt className="text-[var(--muted)]">status</dt>
                <dd key={status} className="fade-in-up capitalize text-[var(--lime)]">
                  {status}
                </dd>
                {demo && (
                  <>
                    <dt className="text-[var(--muted)]">time</dt>
                    <dd className="tabular-nums">{clock}</dd>
                  </>
                )}
              </dl>
            </div>
            {demo && (
              <p className="mt-3 text-[16px] leading-snug text-[var(--text-2)] [@media(max-height:940px)]:hidden">“{CURRENT_NODE.quote}”</p>
            )}
            <button
              type="button"
              aria-label="Open node"
              onClick={openClaim}
              className="pixel-btn font-head mt-2 flex h-7 w-9 items-center justify-center border-2 border-[var(--accent)] text-[10px] text-[var(--link)]"
            >
              →
            </button>
          </>
        )}
      </Card>
    </div>
  );
}
