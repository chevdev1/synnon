"use client";

import dynamic from "next/dynamic";
import type { BrainCanvasProps } from "./BrainCanvas";

// Canvas layer building touches document.createElement("canvas"), so this
// must never run during SSR.
const BrainCanvas = dynamic(() => import("./BrainCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-[14px] uppercase tracking-[0.2em] text-[var(--faint)]">
      waking up…
    </div>
  ),
});

export default function BrainCanvasClient(props: BrainCanvasProps) {
  return <BrainCanvas {...props} />;
}
