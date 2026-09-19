"use client";

import Link from "next/link";
import { useState } from "react";
import Atmosphere from "@/components/landing/Atmosphere";
import DemoToggle from "@/components/landing/DemoToggle";
import { HexIcon } from "@/components/ui/PixelIcon";
import { LiveRoot } from "@/lib/live/LiveRoot";
import { useLive } from "@/lib/live/context";
import NodeProfileView from "./NodeProfileView";
import AnimatedCard from "@/components/card/AnimatedCard";
import { useNodeProfile } from "./useNodeProfile";

const TOTAL = 128;
const nav = "pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--lime)]";

// Share card: the link unfurls into the pixel card from opengraph-image.tsx.
function ShareRow({ id, voices, thoughts, mine }: { id: number; voices: number; thoughts: number; mine: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/node/${id}`;
  const text = mine
    ? `Node ${String(id).padStart(2, "0")} of SYNNOD: ${voices} voice${voices === 1 ? "" : "s"}, ${thoughts} thought${thoughts === 1 ? "" : "s"} shaped. One mind, 128 voices.`
    : `Node ${String(id).padStart(2, "0")} of SYNNOD is still free. 128 voices, one mind.`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <a
        href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="pixel-btn font-head flex h-9 items-center border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-3 text-[8px] uppercase text-[var(--text)]"
      >
        Share on X →
      </a>
      <button type="button" onClick={() => void copy()} className={nav}>
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}

function Body({ id }: { id: number }) {
  const { mode } = useLive();
  const { profile, loading, error } = useNodeProfile(id);
  const prev = id > 1 ? id - 1 : TOTAL;
  const next = id < TOTAL ? id + 1 : 1;

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--divider)] pb-3">
        <Link href="/" className="flex items-center gap-2.5">
          <HexIcon size={22} />
          <span className="font-head text-[11px] tracking-[0.35em] text-[var(--text)]">SYNNOD</span>
        </Link>
        <div className="flex items-center gap-2">
          <DemoToggle />
          <Link href="/" className={nav}>
            ← Brain
          </Link>
        </div>
      </header>

      <main className="flex-1 py-5">
        {mode === "demo" && <p className="font-head mb-3 text-[7px] uppercase text-[#ffd166]">simulated demo data</p>}
        <div className="rounded-[3px] border-2 border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_76%,transparent)] p-4 md:p-6">
          {profile ? (
            <NodeProfileView profile={profile} />
          ) : error ? (
            <p className="text-[18px] text-[#ff8a6c]">{error}</p>
          ) : (
            <p className="font-head text-[8px] uppercase text-[var(--muted)]">{loading ? "reading the cell…" : ""}</p>
          )}
        </div>
        {profile && (
          <section className="mt-4">
            <div className="font-head mb-2 text-[9px] uppercase text-[var(--text)]">Animated card</div>
            <AnimatedCard profile={profile} />
          </section>
        )}
        {profile && <ShareRow id={id} voices={profile.stats.voices} thoughts={profile.stats.thoughtsShaped} mine={profile.node.status !== "available"} />}
      </main>

      <footer className="flex items-center justify-between gap-2 border-t-2 border-[var(--divider)] pt-3">
        <Link href={`/node/${prev}`} className={nav}>
          ← Node {String(prev).padStart(2, "0")}
        </Link>
        <Link href="/" className={nav}>
          Claim a cell
        </Link>
        <Link href={`/node/${next}`} className={nav}>
          Node {String(next).padStart(2, "0")} →
        </Link>
      </footer>
    </div>
  );
}

export default function NodePage({ id }: { id: number }) {
  return (
    <LiveRoot>
      <div className="relative min-h-dvh bg-[var(--bg)]">
        <Atmosphere />
        <Body id={id} />
      </div>
    </LiveRoot>
  );
}
