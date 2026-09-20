"use client";

import { useState } from "react";
import { useLive } from "@/lib/live/context";
import { sfx } from "@/lib/sfx";
import { achActions } from "@/lib/achStore";
import { questActions } from "@/lib/questStore";

// "48", "#48" or part of a nickname. Found → the cell pulses on the brain and
// its card opens; not found → a short pixel "no such voice".
export default function NodeSearch({ onFound }: { onFound: (id: number) => void }) {
  const { nodes } = useLive();
  const [q, setQ] = useState("");
  const [miss, setMiss] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const s = q.trim().replace(/^#/, "").toLowerCase();
    if (!s) return;
    let id: number | null = null;
    if (/^\d{1,3}$/.test(s)) {
      const n = Number(s);
      if (nodes.some((x) => x.id === n)) id = n;
    } else {
      id = nodes.find((x) => x.ownerName?.toLowerCase().includes(s))?.id ?? null;
    }
    if (id == null) {
      sfx.miss();
      setMiss(true);
      window.setTimeout(() => setMiss(false), 1800);
      return;
    }
    sfx.found();
    achActions.unlock("cartographer");
    questActions.event("search");
    setQ("");
    onFound(id);
  }

  return (
    <form onSubmit={submit} data-help-id="search" className="pointer-events-auto flex items-center justify-end gap-1.5 px-3 pb-3 lg:absolute lg:bottom-3 lg:right-3 lg:z-10 lg:p-0">
      {miss && <span className="font-head fade-in-up text-[7px] uppercase text-[#ff8a6c]">no such voice</span>}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="find # or name"
        aria-label="Find a node by number or name"
        maxLength={24}
        className="h-8 min-w-0 flex-1 border-2 border-[var(--border)] bg-[#080a20]/85 px-2 text-[16px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--lime)] lg:w-[150px] lg:flex-none"
      />
      <button type="submit" aria-label="Find" className="pixel-btn font-head flex h-8 w-8 items-center justify-center border-2 border-[var(--accent)] text-[9px] text-[var(--text)]">
        →
      </button>
    </form>
  );
}
