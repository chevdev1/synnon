"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { enterWithMusic } from "@/lib/lofi";
import { useMotion } from "@/lib/motion";

// Opening screen: a pixel night sky. Clicking "enter" is also the user
// gesture browsers require before audio may start.
const KEY = "synnod-entered";
const W = 320;
const H = 180;

const seen = new Set<() => void>();
const subscribe = (cb: () => void) => {
  seen.add(cb);
  return () => seen.delete(cb);
};
const entered = () => {
  try {
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

const STAR_COLORS = ["#ffffff", "#bfe6ff", "#b9a6f5", "#d674dc", "#ffffff"];

function Sky({ animate }: { animate: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const stars = Array.from({ length: 170 }, () => {
      const layer = Math.floor(rnd(0, 3));
      return { x: rnd(0, W), y: rnd(0, H), layer, c: STAR_COLORS[Math.floor(rnd(0, STAR_COLORS.length))], ph: rnd(0, 6.28) };
    });
    let shoot: { x: number; y: number; life: number } | null = null;
    let raf = 0;
    let last = 0;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      // nebula: coarse radial blobs, the low resolution makes them read as pixel-art haze
      const blobs: [number, number, number, string][] = [
        [70, 60, 90, "rgba(108,60,200,0.20)"],
        [250, 130, 100, "rgba(214,116,220,0.14)"],
        [170, 150, 80, "rgba(60,90,220,0.16)"],
      ];
      for (const [x, y, r, col] of blobs) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, col);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      // planet with banded, dithered shading
      const px = 246;
      const py = 58;
      const ring = (front: boolean) => {
        ctx.fillStyle = front ? "rgba(196,242,96,0.6)" : "rgba(196,242,96,0.3)";
        for (let a = 0; a < 6.28; a += 0.02) {
          if ((Math.sin(a) >= 0) === front) ctx.fillRect(Math.round(px + Math.cos(a) * 34), Math.round(py + Math.sin(a) * 8), 1, 1);
        }
      };
      ring(false); // back half sits behind the planet
      for (let y = -24; y <= 24; y++)
        for (let x = -24; x <= 24; x++) {
          const d = Math.hypot(x, y);
          if (d > 24) continue;
          const lit = (x * -0.6 + y * -0.5) / 24 + 0.5 + Math.sin(y * 0.55) * 0.08;
          const dither = (((x + y) & 1) === 0 ? 0.06 : -0.06) * (lit > 0.3 && lit < 0.75 ? 1 : 0);
          const v = lit + dither;
          ctx.fillStyle = v > 0.72 ? "#e9d7ff" : v > 0.52 ? "#b58cf0" : v > 0.32 ? "#6a45b8" : "#2a1760";
          ctx.fillRect(px + x, py + y, 1, 1);
        }
      ring(true);

      for (const s of stars) {
        const speed = (s.layer + 1) * 0.5;
        const x = animate ? (s.x - (t / 1000) * speed * 2 + W * 10) % W : s.x;
        const tw = animate ? 0.55 + 0.45 * Math.sin(t / 500 + s.ph) : 1;
        ctx.globalAlpha = tw;
        ctx.fillStyle = s.c;
        ctx.fillRect(Math.floor(x), Math.floor(s.y), s.layer === 2 ? 2 : 1, s.layer === 2 ? 2 : 1);
      }
      ctx.globalAlpha = 1;

      if (animate) {
        if (!shoot && Math.random() < 0.006) shoot = { x: rnd(W * 0.4, W), y: rnd(0, H * 0.4), life: 1 };
        if (shoot) {
          for (let i = 0; i < 9; i++) {
            ctx.globalAlpha = Math.max(0, shoot.life - i * 0.1);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(Math.floor(shoot.x + i * 2), Math.floor(shoot.y - i), 1, 1);
          }
          ctx.globalAlpha = 1;
          shoot.x -= 3;
          shoot.y += 1.5;
          shoot.life -= 0.02;
          if (shoot.life <= 0) shoot = null;
        }
      }
    };

    if (!animate) {
      draw(0);
      return;
    }
    const loop = (t: number) => {
      if (t - last > 1000 / 24) {
        last = t;
        draw(t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ imageRendering: "pixelated", objectFit: "cover" }}
    />
  );
}

export default function IntroGate() {
  const isEntered = useSyncExternalStore(subscribe, entered, () => false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const { reduced } = useMotion();

  useEffect(() => {
    if (isEntered) document.body.style.overflow = "";
  }, [isEntered]);

  if (isEntered || gone) return null;

  function enter(withMusic: boolean) {
    void enterWithMusic(withMusic); // must run inside the click handler
    setLeaving(true);
    window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(KEY, "1");
      } catch {
        /* ignore */
      }
      setGone(true);
      seen.forEach((cb) => cb());
    }, 750);
  }

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#04051a] transition-opacity duration-700 ${leaving ? "opacity-0" : "opacity-100"}`}
      role="dialog"
      aria-label="Welcome to SYNNOD"
    >
      <Sky animate={!reduced} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(2,3,14,0.75)_100%)]" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <div className="intro-float drop-shadow-[0_0_18px_rgba(196,242,96,0.45)]">
          <svg width="64" height="64" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
            <polygon points="4,1 12,1 15,8 12,15 4,15 1,8" fill="none" stroke="#c4f260" strokeWidth="1.2" />
            <rect x="7" y="7" width="2" height="2" fill="#c4f260" />
          </svg>
        </div>
        <h1 className="font-head mt-5 text-[26px] tracking-[0.35em] text-[var(--text)] drop-shadow-[0_0_14px_rgba(108,95,214,0.9)] sm:text-[34px]">SYNNOD</h1>
        <p className="font-head mt-4 text-[9px] uppercase text-[var(--link)] sm:text-[10px]">128 voices. One mind.</p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => enter(true)}
            className="pixel-btn shimmer-border font-head flex h-12 items-center gap-3 border-2 border-[var(--lime)] bg-[var(--lime)]/10 px-6 text-[10px] uppercase text-[var(--lime)]"
          >
            <span className="cursor-blink">▶</span> Enter · sound on
          </button>
          <button
            type="button"
            onClick={() => enter(false)}
            className="font-head text-[8px] uppercase text-[var(--muted)] transition-colors hover:text-[var(--text)]"
          >
            or enter in silence
          </button>
        </div>
        <p className="mt-8 text-[15px] text-[var(--faint)]">best with headphones · a little lo-fi for the mind</p>
      </div>
    </div>
  );
}
