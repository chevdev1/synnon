"use client";

import { useEffect, useRef } from "react";
import { COSMOS_H, COSMOS_PALETTE, COSMOS_W, drawCosmos } from "@/lib/cosmos";
import { useMotion } from "@/lib/motion";
import { sky } from "@/lib/sky";
import { useTod } from "@/lib/tod";

// The living pixel sky behind the whole interface (every page): three star layers
// with mouse parallax, slow nebulae tinted by the time of day, shooting stars and
// a soft swell whenever something happens in the mind. Drawn at a tiny resolution
// and scaled up, so it stays pixel art and costs almost nothing. Panels are
// slightly translucent, so it shows through them too.
export default function CosmosBg() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();
  const { phase } = useTod();
  const live = useRef({ phase });

  useEffect(() => {
    live.current = { phase };
  }, [phase]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // Resolution follows the window (about one sky pixel per 3 screen pixels), so stars
    // stay small crisp pixels on a big monitor instead of turning into fat squares.
    let W = COSMOS_W;
    let H = COSMOS_H;
    const resize = () => {
      W = Math.max(160, Math.min(640, Math.round(window.innerWidth / 3)));
      H = Math.max(110, Math.min(400, Math.round(window.innerHeight / 3)));
      canvas.width = W;
      canvas.height = H;
      if (reduced) draw(0, false);
    };
    let px = 0; // parallax target / current, -1..1
    let py = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      px = (e.clientX / window.innerWidth - 0.5) * 2;
      py = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    type Meteor = { x: number; y: number; vx: number; vy: number; life: number };
    const meteors: Meteor[] = [];
    const spawn = () => meteors.push({ x: W * (0.35 + Math.random() * 0.65), y: Math.random() * H * 0.35, vx: -2.6 - Math.random(), vy: 1.2 + Math.random() * 0.6, life: 1 });
    let nextMeteor = 3500;
    let nextBurst = 0;
    let raf = 0;
    let last = -1000;

    const draw = (t: number, animated: boolean) => {
      const ph = live.current.phase;
      const dz = sky.dreaming;
      cx += (px - cx) * 0.06;
      cy += (py - cy) * 0.06;
      ctx.clearRect(0, 0, W, H);
      const boost = animated ? Math.max(0, sky.swell * (1 - (performance.now() - sky.swellAt) / 1400)) : 0;
      drawCosmos(ctx, W, H, t, { phase: ph, dreaming: dz, animated, cx, cy, boost });

      // the occasional shooting star, plus bursts asked for by the console (/meteor)
      if (animated) {
        if (!dz && meteors.length === 0 && t > nextMeteor) {
          spawn();
          nextMeteor = t + 6000 + Math.random() * 9000;
        }
        if (sky.meteors > 0 && t > nextBurst) {
          spawn();
          sky.meteors -= 1;
          nextBurst = t + 140;
        }
        for (let m = meteors.length - 1; m >= 0; m--) {
          const meteor = meteors[m];
          for (let i = 0; i < 12; i++) {
            ctx.globalAlpha = Math.max(0, meteor.life - i * 0.08);
            ctx.fillStyle = i < 2 ? "#ffffff" : COSMOS_PALETTE[ph].stars[1];
            ctx.fillRect(Math.floor(meteor.x - meteor.vx * i * 0.9), Math.floor(meteor.y - meteor.vy * i * 0.9), 1, 1);
          }
          ctx.globalAlpha = 1;
          meteor.x += meteor.vx;
          meteor.y += meteor.vy;
          meteor.life -= 0.022;
          if (meteor.life <= 0 || meteor.x < -10 || meteor.y > H + 10) meteors.splice(m, 1);
        }
      }
    };

    window.addEventListener("resize", resize);
    resize();
    if (!reduced) {
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
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
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
