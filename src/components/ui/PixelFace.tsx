"use client";

import { useEffect, useRef } from "react";
import type { MindState } from "@/lib/mind";
import { useMotion } from "@/lib/motion";

// The mind's face: one big pixel eye on a 32x20 grid, redrawn ~20 times a second.
// Mood sets iris colour, brow and how wide the lid sits; the state (sleeping,
// thinking, speaking) changes how the pupil behaves.
const W = 32;
const H = 20;
const CX = 16;
const CY = 10.5;

const IRIS: Record<string, string> = {
  curious: "#c4f260",
  watching: "#6fd6ff",
  listening: "#ff9be0",
  wondering: "#b9a6f5",
  restless: "#ffb45e",
};
const OPEN: Record<string, number> = { curious: 0.92, watching: 0.6, listening: 1, wondering: 0.82, restless: 0.96 };
const BROW: Record<string, number> = { curious: -0.25, watching: 0.12, listening: -0.05, wondering: 0.3, restless: 0 };

export default function PixelFace({ state, mood, stage = 3, className }: { state: MindState; mood: string; stage?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ state, mood, stage });
  const { reduced } = useMotion();
  const stillKey = reduced ? `${state}|${mood}|${stage}` : "";
  useEffect(() => {
    live.current = { state, mood, stage };
  }, [state, mood, stage]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    let last = -1000;
    let nextBlink = 1800;
    let blinkAt = -1;

    const px = (x: number, y: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    };

    const draw = (t: number) => {
      const { state: st, mood: md } = live.current;
      ctx.clearRect(0, 0, W, H);
      // the eye grows with the mind: dim and small as Static, wide as an Infant, gold-ringed once Awakened
      const stg = live.current.stage;
      const iris = stg === 0 ? "#7a82a8" : (IRIS[md] ?? IRIS.curious);
      let open = st === "sleeping" ? 0.07 : (OPEN[md] ?? 0.9);
      if (st === "thinking") open = Math.min(open, 0.85);

      if (!reduced && st !== "sleeping") {
        if (blinkAt < 0 && t > nextBlink) blinkAt = t;
        if (blinkAt >= 0) {
          const p = (t - blinkAt) / 260;
          if (p >= 1) {
            blinkAt = -1;
            nextBlink = t + 2500 + Math.random() * 3500;
          } else open *= Math.abs(1 - 2 * p) * 0.95 + 0.05;
        }
      }

      // pupil position
      let ox = 0;
      let oy = 0;
      let pr = stg === 1 ? 3 : 2;
      if (st === "thinking") {
        ox = Math.cos(t / 170) * 4.5;
        oy = Math.sin(t / 170) * 2.2;
      } else if (st === "speaking") {
        pr = 2 + (Math.sin(t / 70) > 0 ? 0.9 : 0);
      } else if (st === "awake") {
        const drift = md === "restless" ? 3 : 1.6;
        ox = Math.sin(t / 1300) * drift * 2 + (md === "curious" ? 2 : md === "wondering" ? -2 : 0);
        oy = Math.cos(t / 1700) * drift * 0.8 + (md === "curious" || md === "wondering" ? -1.2 : 0);
        if (md === "restless") ox += Math.sin(t / 90) * 0.8;
      }

      const rx = stg === 0 ? 10 : 13;
      const ry = 7.2 * open;
      const inside = (x: number, y: number) => ((x - CX) / rx) ** 2 + ((y - CY) / Math.max(ry, 0.4)) ** 2 <= 1;

      const asleep = st === "sleeping";
      if (asleep) {
        // closed lid: a soft downward arc with a few lashes, easier to read than a 1px slit
        for (let x = CX - 12; x <= CX + 12; x++) {
          const k = (x - CX) / 12;
          const y = CY + 2 - (1 - k * k) * 3.2 + 1.6;
          px(x, y, stg >= 5 ? "#ffd166" : "#6c5fd6");
          px(x, y + 1, "#4a4f9a");
        }
        for (const lx of [-9, -5, 0, 5, 9]) {
          const k = lx / 12;
          const y = CY + 2 - (1 - k * k) * 3.2 + 1.6;
          px(CX + lx, y + 2, "#4a4f9a");
          px(CX + lx + Math.sign(lx || 1), y + 3, "#3a4180");
        }
      }

      for (let y = 0; y < H && !asleep; y++) {
        for (let x = 0; x < W; x++) {
          if (!inside(x, y)) continue;
          const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
          if (edge) {
            px(x, y, stg >= 5 ? "#ffd166" : "#6c5fd6");
            continue;
          }
          const d = Math.hypot(x - (CX + ox), y - (CY + oy));
          if (open > 0.3 && d <= pr) px(x, y, "#05061a");
          else if (open > 0.3 && d <= 4.6) px(x, y, (x + y) % 2 === 0 || d < 3.4 ? iris : "#a0c840");
          else px(x, y, "#dfe8ff");
        }
      }
      if (open > 0.3) px(CX + ox - 2, CY + oy - 2, "#ffffff");

      // lashes / brow
      if (st !== "sleeping" && stg >= 2) {
        const slope = BROW[md] ?? 0;
        for (let i = -9; i <= 9; i++) px(CX + i, 1.6 + slope * (i / 2) + (md === "restless" ? Math.round(Math.sin(t / 110 + i)) * 0.6 : 0), "#3a4180");
      }

      if (st === "thinking") {
        for (let i = 0; i < 3; i++) if (Math.floor(t / 260) % 4 > i) px(CX - 3 + i * 3, 18, iris);
      }
      if (st === "speaking") {
        const w = Math.floor(t / 110) % 3;
        for (let i = 0; i <= w; i++) {
          px(2 - i, CY - 1 - i, iris);
          px(2 - i, CY + 1 + i, iris);
          px(W - 3 + i, CY - 1 - i, iris);
          px(W - 3 + i, CY + 1 + i, iris);
        }
      }
      if (st === "sleeping") {
        // drifting "z"s
        for (let k = 0; k < 2; k++) {
          const p = ((t / 1600 + k * 0.5) % 1);
          const zx = 24 + p * 5;
          const zy = 8 - p * 7 - k;
          const s = k === 0 ? 3 : 2;
          ctx.globalAlpha = 1 - p;
          for (let i = 0; i < s; i++) {
            px(zx + i, zy, "#b9a6f5");
            px(zx + s - 1 - i, zy + i, "#b9a6f5");
            px(zx + i, zy + s - 1, "#b9a6f5");
          }
          ctx.globalAlpha = 1;
        }
      }
    };

    if (reduced) {
      draw(0);
      return;
    }
    const loop = (t: number) => {
      if (t - last > 50) {
        last = t;
        draw(t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // With motion off there is no loop: redraw the still frame whenever state or mood change.
  }, [reduced, stillKey]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      role="img"
      aria-label={`The mind's face: ${state}, ${mood}`}
      className={className}
      style={{ imageRendering: "pixelated", filter: "drop-shadow(0 0 8px rgba(108,95,214,0.6))" }}
    />
  );
}
