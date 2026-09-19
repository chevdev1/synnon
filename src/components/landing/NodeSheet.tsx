"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NodeProfileView from "@/components/node/NodeProfileView";
import { useNodeProfile } from "@/components/node/useNodeProfile";

const EVENT = "synnod:open-node";
export const openNode = (id: number) => window.dispatchEvent(new CustomEvent<number>(EVENT, { detail: id }));

// Click on a taken cell: its profile slides in over the brain (right drawer on
// desktop, bottom sheet on phones). The same view lives on /node/[id].
export default function NodeSheet() {
  const [id, setId] = useState<number | null>(null);
  const { profile, loading, error } = useNodeProfile(id);

  useEffect(() => {
    const on = (e: Event) => setId((e as CustomEvent<number>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  useEffect(() => {
    if (id == null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id]);

  if (id == null) return null;
  const close = () => setId(null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-[2px] md:items-stretch md:justify-end" onMouseDown={(e) => e.target === e.currentTarget && close()} role="dialog" aria-modal="true" aria-label={`Node ${id}`} data-node-sheet>
      <aside className="sheet-in flex max-h-[88dvh] w-full flex-col border-2 border-[var(--accent)] bg-[var(--panel)] shadow-[0_-6px_0_rgba(108,95,214,0.4)] md:max-h-none md:w-[460px] md:border-y-0 md:border-r-0 md:shadow-[-6px_0_0_rgba(108,95,214,0.4)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-[var(--divider)] px-4 py-2.5">
          <span className="font-head text-[9px] uppercase text-[var(--muted)]">{`// node profile`}</span>
          <button type="button" onClick={close} aria-label="Close" className="font-head flex h-9 w-9 items-center justify-center text-[11px] text-[var(--muted)] hover:text-[var(--lime)]">
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {profile ? (
            <NodeProfileView profile={profile} compact />
          ) : error ? (
            <p className="text-[17px] text-[#ff8a6c]">{error}</p>
          ) : (
            <p className="font-head text-[8px] uppercase text-[var(--muted)]">{loading ? "reading the cell…" : ""}</p>
          )}
        </div>
        <div className="shrink-0 border-t-2 border-[var(--divider)] p-3">
          <Link href={`/node/${id}`} className="pixel-btn font-head flex h-10 items-center justify-center border-2 border-[var(--accent)] bg-[var(--accent)]/10 text-[9px] uppercase text-[var(--text)]">
            Open full page →
          </Link>
        </div>
      </aside>
    </div>
  );
}
