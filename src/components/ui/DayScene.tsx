"use client";

import { useEffect, useRef } from "react";
import { drawScene, type SceneOpts } from "@/lib/scene";
import { useMotion } from "@/lib/motion";

// The picture of the day on a canvas: animated (clouds drift, water shimmers, leaves sway),
// or a single still frame when motion is off. The size is the pixel grid, CSS scales it up.
export default function DayScene({ w, h, opts, className, label }: { w: number; h: number; opts: Omit<SceneOpts, "animated">; className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();
  const { seed, phase, mood, voices, total, stage } = opts;

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const o = { seed, phase, mood, voices, total, stage };
    if (reduced) {
      drawScene(ctx, w, h, 0, { ...o, animated: false });
      return;
    }
    let raf = 0;
    let last = -1000;
    const loop = (t: number) => {
      if (t - last > 66 && !document.hidden) {
        last = t;
        drawScene(ctx, w, h, t, { ...o, animated: true });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [w, h, seed, phase, mood, voices, total, stage, reduced]);

  return <canvas ref={ref} width={w} height={h} role="img" aria-label={label ?? "Picture of the day"} className={className} style={{ imageRendering: "pixelated" }} data-day-scene />;
}
