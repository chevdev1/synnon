"use client";

import { useEffect, useRef } from "react";
import { useMotion } from "@/lib/motion";

type RGB = readonly [number, number, number];

class Pix {
  constructor(
    readonly w: number,
    readonly h: number,
    readonly data: Uint8ClampedArray
  ) {}
  set(x: number, y: number, c: RGB, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = a;
  }
  get(x: number, y: number): RGB {
    const i = (y * this.w + x) * 4;
    return [this.data[i], this.data[i + 1], this.data[i + 2]];
  }
}

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)] / 16;

function PixelCanvas({
  w,
  h,
  scale,
  draw,
  fps = 6,
  className,
  label,
}: {
  w: number;
  h: number;
  scale: number;
  draw: (p: Pix, t: number) => void;
  fps?: number;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const img = ctx.createImageData(w, h);
    const pix = new Pix(w, h, img.data);
    const render = (t: number) => {
      img.data.fill(0);
      draw(pix, t);
      ctx.putImageData(img, 0, 0);
    };
    render(0);
    if (reduced) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      if (!document.hidden) render((performance.now() - start) / 1000);
    }, 1000 / fps);
    return () => window.clearInterval(id);
  }, [w, h, draw, fps, reduced]);

  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      role="img"
      aria-label={label}
      className={className}
      style={{ width: w * scale, height: h * scale, imageRendering: "pixelated" }}
    />
  );
}

/* ---------- night world: dithered sky, moon, mountains, lake ---------- */

const SKY_TOP: RGB = [18, 10, 46];
const SKY_MID: RGB = [60, 28, 116];
const SKY_LOW: RGB = [176, 74, 154];
const FAR: RGB = [44, 22, 96];
const NEAR: RGB = [22, 10, 56];
const MOON: RGB = [236, 226, 255];

const W_W = 44;
const W_H = 52;
const HORIZON = 32;

function ridge(x: number, seed: number, base: number, amp: number) {
  return (
    base -
    amp * (0.55 * Math.sin(x * 0.21 + seed) + 0.3 * Math.sin(x * 0.53 + seed * 2.1) + 0.15 * Math.sin(x * 1.1 + seed * 3.3) + 1)
  );
}

function drawWorld(p: Pix, t: number) {
  const farLine = (x: number) => ridge(x, 1.3, HORIZON + 1, 7) - (x === 14 || x === 15 ? 5 : 0); // a spire
  const nearLine = (x: number) => ridge(x, 4.1, HORIZON + 3, 5);

  for (let y = 0; y < HORIZON; y++) {
    const k = y / HORIZON;
    const base = k < 0.55 ? mix(SKY_TOP, SKY_MID, k / 0.55) : mix(SKY_MID, SKY_LOW, (k - 0.55) / 0.45);
    for (let x = 0; x < W_W; x++) {
      const d = bayer(x, y) - 0.5;
      p.set(x, y, mix(base, k < 0.55 ? SKY_MID : SKY_LOW, Math.max(0, Math.min(1, 0.5 + d * 0.9 * Math.min(k * 3, 1)))));
    }
  }

  // stars (fixed spots, each twinkles on its own phase)
  for (let i = 0; i < 16; i++) {
    const sx = Math.floor(hash(i) * W_W);
    const sy = Math.floor(hash(i + 50) * (HORIZON - 12));
    if (Math.sin(t * 2 + i * 1.9) > -0.2) p.set(sx, sy, [235, 235, 255]);
  }

  // moon + soft halo
  const mx = 31;
  const my = 10;
  for (let y = -8; y <= 8; y++)
    for (let x = -8; x <= 8; x++) {
      const d = Math.hypot(x, y);
      if (d <= 4) p.set(mx + x, my + y, d > 3.2 ? [206, 190, 250] : MOON);
      else if (d < 7 && bayer(mx + x, my + y) > d / 7) p.set(mx + x, my + y, [96, 62, 170]);
    }

  for (let x = 0; x < W_W; x++) {
    for (let y = Math.floor(farLine(x)); y < HORIZON; y++) p.set(x, y, FAR);
    for (let y = Math.floor(nearLine(x)); y < HORIZON; y++) p.set(x, y, NEAR);
  }

  // lake: mirrored sky with horizontal shimmer
  for (let y = HORIZON; y < W_H; y++) {
    const depth = y - HORIZON;
    const srcY = Math.max(0, HORIZON - 1 - depth * 1.2);
    for (let x = 0; x < W_W; x++) {
      const wob = Math.round(Math.sin(t * 1.6 + depth * 0.9 + x * 0.05) * (0.6 + depth * 0.07));
      const sx = Math.max(0, Math.min(W_W - 1, x + wob));
      const src = p.get(sx, Math.floor(srcY));
      const dark = mix(src, [8, 5, 26], 0.45 + depth * 0.012);
      p.set(x, y, mix(dark, [8, 5, 26], bayer(x, y) > 0.55 ? 0.18 : 0));
    }
  }
  // moon glitter column
  for (let y = HORIZON + 1; y < W_H; y += 2) {
    const off = Math.round(Math.sin(t * 2.2 + y) * 2);
    const len = 2 + ((y * 7) % 3);
    for (let x = 0; x < len; x++) p.set(mx - 1 + off + x, y, [190, 170, 240]);
  }
}

export function PixelWorld({ scale = 2, className }: { scale?: number; className?: string }) {
  return <PixelCanvas w={W_W} h={W_H} scale={scale} draw={drawWorld} fps={8} className={className} label="A pixel night landscape with a moon reflected in a lake" />;
}

/* ---------- node thumbnail: night city inside a hexagon ---------- */

const CW = 28;
const CH = 32;
const inHex = (x: number, y: number) => {
  const dx = Math.abs(x + 0.5 - CW / 2) / (CW / 2);
  const dy = Math.abs(y + 0.5 - CH / 2) / (CH / 2);
  return dx <= 1 && dy <= 1 - dx * 0.5;
};

const BUILDINGS = [
  { x: 3, w: 5, top: 15 },
  { x: 8, w: 4, top: 10 },
  { x: 12, w: 6, top: 13 },
  { x: 18, w: 4, top: 8 },
  { x: 22, w: 4, top: 16 },
];

function drawCity(p: Pix, t: number) {
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      if (!inHex(x, y)) continue;
      const k = y / CH;
      p.set(x, y, mix([16, 9, 44], [58, 28, 100], k * k));
    }
  for (let i = 0; i < 7; i++) {
    const sx = 4 + Math.floor(hash(i + 9) * 20);
    const sy = 3 + Math.floor(hash(i + 30) * 8);
    if (inHex(sx, sy) && Math.sin(t * 2.4 + i * 2.3) > 0) p.set(sx, sy, [220, 220, 255]);
  }
  BUILDINGS.forEach((b, bi) => {
    for (let y = b.top; y < CH; y++)
      for (let x = b.x; x < b.x + b.w; x++) if (inHex(x, y)) p.set(x, y, bi % 2 ? [30, 18, 70] : [38, 22, 84]);
    for (let y = b.top + 2; y < CH - 2; y += 3)
      for (let x = b.x + 1; x < b.x + b.w - 1; x += 2) {
        const seed = bi * 100 + y * 10 + x;
        const lit = Math.sin(t * 0.6 + hash(seed) * 30) > -0.35 && hash(seed + 7) > 0.35;
        if (lit && inHex(x, y)) p.set(x, y, hash(seed + 3) > 0.5 ? [245, 215, 110] : [127, 200, 255]);
      }
  });
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++)
      if (inHex(x, y) && !(inHex(x - 1, y) && inHex(x + 1, y) && inHex(x, y - 1) && inHex(x, y + 1))) p.set(x, y, [108, 95, 214]);
}

export function PixelCity({ scale = 2, className }: { scale?: number; className?: string }) {
  return <PixelCanvas w={CW} h={CH} scale={scale} draw={drawCity} fps={4} className={className} label="A night city inside a hexagon" />;
}

/* ---------- character: hex frame, dark head silhouette, blinking eye glint ---------- */

const HW = 24;
const HH = 26;
const inFrame = (x: number, y: number) => {
  const dx = Math.abs(x + 0.5 - HW / 2) / (HW / 2);
  const dy = Math.abs(y + 0.5 - HH / 2) / (HH / 2);
  return dx <= 1 && dy <= 1 - dx * 0.5;
};

function drawCharacter(p: Pix, t: number) {
  for (let y = 0; y < HH; y++)
    for (let x = 0; x < HW; x++) if (inFrame(x, y)) p.set(x, y, mix([14, 8, 40], [30, 16, 66], y / HH));

  const cx = 12;
  const cy = 12;
  for (let y = 0; y < HH; y++)
    for (let x = 0; x < HW; x++) {
      const head = ((x - cx) / 5.6) ** 2 + ((y - cy) / 7) ** 2;
      const shoulders = y > 19 && Math.abs(x - cx) < 4 + (y - 19) * 1.6;
      if ((head < 1 || shoulders) && inFrame(x, y)) {
        const rim = x < cx - 3 && head < 1 && head > 0.62;
        p.set(x, y, rim ? [214, 116, 220] : [18, 10, 46]);
      }
    }
  // eye: two-pixel glint that blinks every ~4s
  const blink = (t % 4) > 3.75;
  if (!blink) {
    p.set(10, 11, [196, 242, 96]);
    p.set(14, 11, [196, 242, 96]);
  }
  const pulse: RGB = Math.sin(t * 2) > 0 ? [154, 88, 200] : [120, 66, 170];
  for (let y = 0; y < HH; y++)
    for (let x = 0; x < HW; x++)
      if (inFrame(x, y) && !(inFrame(x - 1, y) && inFrame(x + 1, y) && inFrame(x, y - 1) && inFrame(x, y + 1)))
        p.set(x, y, pulse);
}

export function PixelCharacter({ scale = 2, className }: { scale?: number; className?: string }) {
  return <PixelCanvas w={HW} h={HH} scale={scale} draw={drawCharacter} fps={6} className={className} label="SYNNOD character avatar" />;
}
