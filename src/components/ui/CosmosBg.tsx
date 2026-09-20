"use client";

import { useEffect, useRef } from "react";
import { COSMOS_H, COSMOS_PALETTE, COSMOS_W, drawCosmos } from "@/lib/cosmos";
import { useMotion } from "@/lib/motion";
import { sky } from "@/lib/sky";
import { calendarSky } from "@/lib/weather";
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
    // scrolling drifts the stars: the sky slides at a different depth than the page
    let sy = 0;
    let lastScroll = window.scrollY;
    const onScroll = () => {
      sy = Math.max(-1.5, Math.min(1.5, sy + (window.scrollY - lastScroll) * 0.01));
      lastScroll = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });

    type Meteor = { x: number; y: number; vx: number; vy: number; life: number };
    const meteors: Meteor[] = [];
    const spawn = () => meteors.push({ x: W * (0.35 + Math.random() * 0.65), y: Math.random() * H * 0.35, vx: -2.6 - Math.random(), vy: 1.2 + Math.random() * 0.6, life: 1 });
    let nextMeteor = 3500;
    let nextBurst = 0;

    // real meteor-shower nights come from the calendar (lib/weather)
    const test = new URLSearchParams(window.location.search).get("skytest");
    let cal = calendarSky(new Date(), test);
    let calAt = 0;
    let raf = 0;
    let last = -1000;
    let drawnAt = 0;

    const draw = (t: number, animated: boolean) => {
      const ph = live.current.phase;
      const dz = sky.dreaming;
      const k = drawnAt > 0 ? Math.min(100, t - drawnAt) / 50 : 1; // motion below was tuned for 20 fps
      drawnAt = t;
      cx += (px - cx) * (1 - Math.pow(0.94, k));
      sy *= Math.pow(0.94, k);
      cy += (py + sy - cy) * (1 - Math.pow(0.94, k));
      ctx.clearRect(0, 0, W, H);
      const boost = animated ? Math.max(0, sky.swell * (1 - (performance.now() - sky.swellAt) / 1400)) : 0;
      const gt = sky.goalTier; // community goal: 1 more shooting stars, 2 aurora, 3 golden stars
      drawCosmos(ctx, W, H, t, { phase: ph, dreaming: dz, animated, cx, cy, boost, aurora: gt >= 2, gold: gt >= 3 });

      if (animated && t - calAt > 5000) {
        cal = calendarSky(new Date(), test);
        calAt = t;
      }

      // the occasional shooting star, plus bursts asked for by the console (/meteor)
      if (animated) {
        const rich = sky.goalTier >= 1 || cal.shower;
        if (!dz && meteors.length < (rich ? 3 : 1) && t > nextMeteor) {
          spawn();
          nextMeteor = t + (6000 + Math.random() * 9000) / (rich ? 3.5 : 1);
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
          meteor.x += meteor.vx * k;
          meteor.y += meteor.vy * k;
          meteor.life -= 0.022 * k;
          if (meteor.life <= 0 || meteor.x < -10 || meteor.y > H + 10) meteors.splice(m, 1);
        }
      }
    };

    window.addEventListener("resize", resize);
    resize();
    if (!reduced) {
      const loop = (t: number) => {
        if (t - last >= 30 && !document.hidden) {
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
      window.removeEventListener("scroll", onScroll, true);
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
