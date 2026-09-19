"use client";

import { useEffect, useRef } from "react";
import { COSMOS_H, COSMOS_PALETTE, COSMOS_W, drawCosmos } from "@/lib/cosmos";
import { useLive } from "@/lib/live/context";
import { useMind } from "@/lib/mind";
import { useMotion } from "@/lib/motion";
import { useTod } from "@/lib/tod";

// A living night sky behind the brain: three star layers with mouse parallax,
// slowly drifting nebulae tinted by the time of day, shooting stars, and a soft
// swell whenever something happens in the mind (a claim swells it the most).
// Drawn at a tiny resolution and scaled up, so it stays pixel art and costs almost nothing.
export default function CosmosBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();
  const { phase } = useTod();
  const { dreaming } = useMind();
  const { pulseEvent } = useLive();
  const live = useRef({ phase, dreaming });
  const swell = useRef({ v: 0, t: 0 });

  useEffect(() => {
    live.current = { phase, dreaming };
  }, [phase, dreaming]);

  useEffect(() => {
    if (!pulseEvent) return;
    swell.current = { v: pulseEvent.type === "claim" ? 1 : pulseEvent.type === "thought" ? 0.7 : 0.45, t: performance.now() };
  }, [pulseEvent]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const host = canvas.parentElement;
    let px = 0; // parallax target / current, -1..1
    let py = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      if (!host) return;
      const r = host.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width - 0.5) * 2;
      py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      px = 0;
      py = 0;
    };
    host?.addEventListener("pointermove", onMove);
    host?.addEventListener("pointerleave", onLeave);

    let meteor: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    let nextMeteor = 3500;
    let raf = 0;
    let last = -1000;

    const draw = (t: number, animated: boolean) => {
      const { phase: ph, dreaming: dz } = live.current;
      cx += (px - cx) * 0.06;
      cy += (py - cy) * 0.06;
      ctx.clearRect(0, 0, COSMOS_W, COSMOS_H);
      const sw = swell.current;
      const boost = animated ? Math.max(0, sw.v * (1 - (performance.now() - sw.t) / 1400)) : 0;
      drawCosmos(ctx, COSMOS_W, COSMOS_H, t, { phase: ph, dreaming: dz, animated, cx, cy, boost });

      // the occasional shooting star
      if (animated && !dz) {
        if (!meteor && t > nextMeteor) {
          meteor = { x: COSMOS_W * (0.35 + Math.random() * 0.65), y: Math.random() * COSMOS_H * 0.35, vx: -2.6 - Math.random(), vy: 1.2 + Math.random() * 0.6, life: 1 };
          nextMeteor = t + 6000 + Math.random() * 9000;
        }
        if (meteor) {
          for (let i = 0; i < 12; i++) {
            ctx.globalAlpha = Math.max(0, meteor.life - i * 0.08);
            ctx.fillStyle = i < 2 ? "#ffffff" : COSMOS_PALETTE[ph].stars[1];
            ctx.fillRect(Math.floor(meteor.x - meteor.vx * i * 0.9), Math.floor(meteor.y - meteor.vy * i * 0.9), 1, 1);
          }
          ctx.globalAlpha = 1;
          meteor.x += meteor.vx;
          meteor.y += meteor.vy;
          meteor.life -= 0.022;
          if (meteor.life <= 0 || meteor.x < -10 || meteor.y > COSMOS_H + 10) meteor = null;
        }
      }
    };

    if (reduced) {
      draw(0, false);
    } else {
      const loop = (t: number) => {
        if (t - last > 50 && !document.hidden) {
          last = t;
          draw(t, true);
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      host?.removeEventListener("pointermove", onMove);
      host?.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, phase]);

  return (
    <canvas
      ref={ref}
      width={COSMOS_W}
      height={COSMOS_H}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ imageRendering: "pixelated", objectFit: "cover" }}
    />
  );
}
