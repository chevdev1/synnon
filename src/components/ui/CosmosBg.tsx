"use client";

import { useEffect, useRef } from "react";
import { COSMOS_H, COSMOS_PALETTE, COSMOS_W, drawCosmos } from "@/lib/cosmos";
import { useMotion } from "@/lib/motion";
import { sky, type Weather } from "@/lib/sky";
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

    // The sky follows the calendar and the clock, the same for everybody (see lib/weather):
    // weather slots biased by the season, the season's own visitors (leaves, petals,
    // fireflies), real meteor-shower nights and New Year fireworks. Nothing is summoned.
    const test = process.env.NODE_ENV !== "production" ? new URLSearchParams(window.location.search).get("skytest") : null;
    type Drop = { x: number; y: number; vx: number; vy: number; big: boolean };
    const drops: Drop[] = [];
    let wx: Weather = "clear";
    let wAmt = 0;
    let bolt: { pts: [number, number][]; life: number } | null = null;
    let nextBolt = 0;
    type Fly = { x: number; y: number; vx: number; vy: number; ph: number; c: string };
    const flies: Fly[] = [];
    let flyKind: string | null = null;
    type Boom = { x: number; y: number; born: number; c: string };
    const booms: Boom[] = [];
    let nextBoom = 0;
    let cal = calendarSky(new Date(), test);
    let calAt = 0;
    const LEAF = ["#e0862e", "#c4502a", "#d9b13a"];
    const PETAL = ["#ffc2e0", "#ffdff0", "#f7a8d0"];
    const BOOM = ["#ffd166", "#ff8ab8", "#7fe3ff", "#c4f260"];
    const makeBolt = () => {
      const pts: [number, number][] = [];
      let x = W * (0.15 + Math.random() * 0.7);
      for (let y = 0; y < H * (0.55 + Math.random() * 0.3); y += 2) {
        pts.push([Math.round(x), y]);
        x += Math.random() < 0.5 ? 0 : Math.random() < 0.5 ? -1 : 1;
        if (Math.random() < 0.06) x += Math.random() < 0.5 ? -3 : 3;
      }
      bolt = { pts, life: 1 };
    };
    const weather = (t: number, dz: boolean) => {
      if (t - calAt > 5000) {
        cal = calendarSky(new Date(), test);
        calAt = t;
      }
      const want: Weather = dz ? "clear" : cal.weather;
      let target = 1;
      if (want !== wx) {
        if (wAmt > 0.04) target = 0;
        else {
          wx = want;
          drops.length = 0;
          nextBolt = t + 2500;
        }
      }
      if (wx === "clear") target = 0;
      wAmt += (target - wAmt) * 0.04;
      sky.weather = wx;
      // the season's ambient visitors
      const kind = dz ? null : cal.visitor;
      if (kind !== flyKind) {
        flyKind = kind;
        flies.length = 0;
      }
      if (kind && (kind !== "firefly" || live.current.phase !== "day")) {
        const n = kind === "leaf" ? 14 : kind === "petal" ? 16 : 12;
        while (flies.length < n) flies.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0.2 + Math.random() * 0.3, ph: Math.random() * 6.3, c: kind === "leaf" ? LEAF[flies.length % 3] : kind === "petal" ? PETAL[flies.length % 3] : "#d8ff7a" });
        for (const f of flies) {
          if (kind === "firefly") {
            f.vx += (Math.random() - 0.5) * 0.06;
            f.vy += (Math.random() - 0.5) * 0.06;
            f.vx = Math.max(-0.3, Math.min(0.3, f.vx));
            f.vy = Math.max(-0.3, Math.min(0.3, f.vy));
            f.x = (f.x + f.vx + W) % W;
            f.y = (f.y + f.vy + H) % H;
            const a = 0.5 + 0.5 * Math.sin(t / 420 + f.ph);
            ctx.globalAlpha = 0.14 * a;
            ctx.fillStyle = f.c;
            ctx.fillRect(Math.floor(f.x) - 1, Math.floor(f.y) - 1, 3, 3);
            ctx.globalAlpha = 0.35 + 0.65 * a;
            ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 1, 1);
          } else {
            f.y += f.vy;
            f.x += kind === "leaf" ? Math.sin(t / 700 + f.ph) * 0.4 : 0.25 + Math.sin(t / 900 + f.ph) * 0.25;
            if (f.y > H + 2 || f.x > W + 3 || f.x < -3) {
              f.y = -2;
              f.x = Math.random() * W;
            }
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = f.c;
            ctx.fillRect(Math.floor(f.x), Math.floor(f.y), 2, kind === "leaf" ? 1 : 2 - (Math.floor(f.ph) % 2));
          }
        }
        ctx.globalAlpha = 1;
      }
      // New Year fireworks
      if (cal.newYear && !dz) {
        if (t > nextBoom) {
          booms.push({ x: W * (0.12 + Math.random() * 0.76), y: H * (0.12 + Math.random() * 0.4), born: t, c: BOOM[Math.floor(Math.random() * BOOM.length)] });
          nextBoom = t + 1400 + Math.random() * 2200;
        }
        for (let i = booms.length - 1; i >= 0; i--) {
          const bm = booms[i];
          const age = (t - bm.born) / 1300;
          if (age >= 1) {
            booms.splice(i, 1);
            continue;
          }
          ctx.fillStyle = bm.c;
          ctx.globalAlpha = 1 - age;
          const r = 3 + age * 16;
          for (let k = 0; k < 20; k++) {
            const an = (k / 20) * Math.PI * 2;
            ctx.fillRect(Math.round(bm.x + Math.cos(an) * r), Math.round(bm.y + Math.sin(an) * r + age * age * 7), 2, 2);
          }
          ctx.globalAlpha = 1;
        }
      }
      if (wx === "clear" || wAmt < 0.01) return;
      const snow = wx === "snow";
      const want2 = Math.round((snow ? 70 : 110) * wAmt);
      while (drops.length < want2) drops.push({ x: Math.random() * (W + 20), y: -Math.random() * H, vx: snow ? 0 : -0.7, vy: snow ? 0.35 + Math.random() * 0.45 : 3 + Math.random() * 1.6, big: snow && Math.random() < 0.25 });
      ctx.fillStyle = snow ? "#f2f6ff" : "#9ec8ff";
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.y += d.vy;
        d.x += snow ? Math.sin((d.y + i * 9) / 9) * 0.35 : d.vx;
        if (d.y > H || d.x < -4) {
          if (drops.length > want2) {
            drops.splice(i, 1);
            continue;
          }
          d.y = -2;
          d.x = Math.random() * (W + 20);
        }
        ctx.globalAlpha = snow ? 0.85 : 0.5;
        if (snow) ctx.fillRect(Math.floor(d.x), Math.floor(d.y), d.big ? 2 : 1, d.big ? 2 : 1);
        else ctx.fillRect(Math.floor(d.x), Math.floor(d.y), 1, 3);
      }
      ctx.globalAlpha = 1;
      if (wx === "storm") {
        if (!bolt && t > nextBolt && wAmt > 0.6) {
          makeBolt();
          nextBolt = t + 3000 + Math.random() * 7000;
        }
        if (bolt) {
          const b = bolt as { pts: [number, number][]; life: number };
          ctx.fillStyle = "rgba(190,205,255," + (0.22 * b.life).toFixed(3) + ")";
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = Math.min(1, b.life * 1.6);
          ctx.fillStyle = "#cfe0ff";
          for (const [x, y] of b.pts) ctx.fillRect(x - 1, y, 3, 2);
          ctx.fillStyle = "#ffffff";
          for (const [x, y] of b.pts) ctx.fillRect(x, y, 1, 2);
          ctx.globalAlpha = 1;
          b.life -= 0.13;
          if (b.life <= 0) bolt = null;
        }
      }
    };

    let raf = 0;
    let last = -1000;

    const draw = (t: number, animated: boolean) => {
      const ph = live.current.phase;
      const dz = sky.dreaming;
      cx += (px - cx) * 0.06;
      sy *= 0.94;
      cy += (py + sy - cy) * 0.06;
      ctx.clearRect(0, 0, W, H);
      const boost = animated ? Math.max(0, sky.swell * (1 - (performance.now() - sky.swellAt) / 1400)) : 0;
      const gt = sky.goalTier; // community goal: 1 more shooting stars, 2 aurora, 3 golden stars
      drawCosmos(ctx, W, H, t, { phase: ph, dreaming: dz, animated, cx, cy, boost, aurora: gt >= 2, gold: gt >= 3 });

      if (animated) weather(t, dz);

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
