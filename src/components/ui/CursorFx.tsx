"use client";

import { useEffect, useRef } from "react";
import { useMotion } from "@/lib/motion";

// A short trail of pixel sparks behind the mouse and a pixel burst on click.
// Mouse only (skipped on touch), and skipped when the visitor asked for
// reduced motion. Draws on one fixed canvas and only runs while sparks exist.

const COLORS = ["#c4f260", "#d674dc", "#bfe6ff", "#ffffff"];
const PX = 3; // spark size, and the grid sparks snap to, for the 8-bit look

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  color: string;
}

export default function CursorFx() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || reduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const sparks: Spark[] = [];
    let raf = 0;
    let running = false;
    let last = { x: -100, y: -100 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const frame = (t: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        const age = t - s.born;
        if (age >= s.life) {
          sparks.splice(i, 1);
          continue;
        }
        const k = age / s.life;
        const x = s.x + (s.vx * age) / 1000;
        const y = s.y + (s.vy * age) / 1000;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = s.color;
        const size = k > 0.6 ? PX - 1 : PX; // shrinks at the end
        ctx.fillRect(Math.round(x / PX) * PX, Math.round(y / PX) * PX, size, size);
      }
      ctx.globalAlpha = 1;
      if (sparks.length > 0) raf = requestAnimationFrame(frame);
      else running = false;
    };
    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)];

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (Math.hypot(e.clientX - last.x, e.clientY - last.y) < 14) return;
      last = { x: e.clientX, y: e.clientY };
      sparks.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 30, vy: 12 + Math.random() * 24, born: performance.now(), life: 420, color: pick() });
      if (sparks.length > 60) sparks.shift();
      start();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const v = 70 + Math.random() * 60;
        sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, born: performance.now(), life: 520, color: pick() });
      }
      start();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[90] h-full w-full" />;
}
