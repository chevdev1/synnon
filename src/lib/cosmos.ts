import type { Tod } from "@/lib/tod";

// Shared sky painter: the living background behind the brain and the animated
// share card draw the same stars and nebulae, at different canvas sizes.
export const COSMOS_W = 256;
export const COSMOS_H = 172;

export const COSMOS_PALETTE: Record<Tod, { blobs: [number, number, number][]; stars: string[] }> = {
  night: { blobs: [[108, 60, 200], [70, 90, 220], [214, 116, 220]], stars: ["#ffffff", "#bfe6ff", "#b9a6f5", "#d674dc"] },
  dawn: { blobs: [[255, 130, 110], [230, 90, 150], [255, 200, 120]], stars: ["#ffffff", "#ffd9c4", "#ffb3c8", "#ffe6a0"] },
  day: { blobs: [[60, 170, 230], [80, 130, 240], [80, 210, 200]], stars: ["#ffffff", "#d4f3ff", "#a8dcff", "#c8f5ee"] },
  dusk: { blobs: [[200, 80, 190], [130, 70, 210], [255, 130, 120]], stars: ["#ffffff", "#f3c6ff", "#ffb0d8", "#ffd0a8"] },
};

interface Star {
  x: number;
  y: number;
  layer: 0 | 1 | 2;
  c: number;
  ph: number;
}

// Deterministic pseudo-random so the sky is the same on every render.
const rnd = (() => {
  let s = 0x9e3779b9;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
})();

const STARS: Star[] = Array.from({ length: 110 }, (_, i) => ({
  x: rnd() * COSMOS_W,
  y: rnd() * COSMOS_H,
  layer: (i % 11 < 6 ? 0 : i % 11 < 9 ? 1 : 2) as 0 | 1 | 2,
  c: Math.floor(rnd() * 4),
  ph: rnd() * 6.28,
}));

const BLOBS = [
  { x: 0.2, y: 0.3, r: 0.55, sx: 0.011, sy: 0.007, ph: 0 },
  { x: 0.78, y: 0.65, r: 0.6, sx: 0.008, sy: 0.011, ph: 2.1 },
  { x: 0.5, y: 0.92, r: 0.5, sx: 0.013, sy: 0.006, ph: 4.2 },
];

export interface CosmosOpts {
  phase: Tod;
  dreaming: boolean;
  animated: boolean;
  cx: number; // parallax, -1..1
  cy: number;
  boost: number; // 0..1 swell after an event
  aurora?: boolean; // community goal, tier 2
  gold?: boolean; // community goal, tier 3
}

const GOLD_STARS = ["#ffffff", "#ffe9a8", "#ffd166", "#fff3c4"];

// Draws nebulae + stars onto a canvas of any size (coordinates scale from 256x172).
export function drawCosmos(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, o: CosmosOpts) {
  const pal = COSMOS_PALETTE[o.phase];
  const speed = o.dreaming ? 0.35 : 1;
  const k = W / COSMOS_W;

  ctx.globalCompositeOperation = "lighter";
  BLOBS.forEach((b, i) => {
    const bx = (b.x + Math.sin(t * b.sx * 0.001 * speed + b.ph) * 0.12 - o.cx * 0.03) * W;
    const by = (b.y + Math.cos(t * b.sy * 0.001 * speed + b.ph) * 0.1 - o.cy * 0.03) * H;
    const rad = b.r * W * (0.9 + 0.1 * Math.sin(t * 0.0004 * speed + b.ph));
    const [r, g, bl] = pal.blobs[i];
    const a = (o.dreaming ? 0.1 : 0.16) + o.boost * 0.16;
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
    grad.addColorStop(0, `rgba(${r},${g},${bl},${a.toFixed(3)})`);
    grad.addColorStop(1, `rgba(${r},${g},${bl},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  });
  ctx.globalCompositeOperation = "source-over";

  // community goal, tier 2: ribbons of aurora across the upper sky
  if (o.aurora) {
    ctx.globalCompositeOperation = "lighter";
    for (let x = 0; x < W; x += 2) {
      const y0 = H * 0.2 + Math.sin((x / k) * 0.05 + t / 1700) * H * 0.06 + Math.sin((x / k) * 0.13 + t / 900) * H * 0.02;
      const h = H * (0.16 + 0.03 * Math.sin((x / k) * 0.09 + t / 1200));
      for (let j = 0; j < 6; j++) {
        const a = 0.13 * Math.sin(((j + 0.5) / 6) * Math.PI);
        ctx.fillStyle = j < 3 ? `rgba(110,255,190,${a.toFixed(3)})` : `rgba(214,116,220,${a.toFixed(3)})`;
        ctx.fillRect(x, y0 + (h * j) / 6, 2, h / 6 + 1);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  for (const s of STARS) {
    const depth = s.layer + 1; // 1 far .. 3 near
    const drift = o.animated ? (t / 1000) * depth * 0.9 * speed * k : 0;
    const x = (((s.x * k - drift - o.cx * depth * 3.2) % W) + W) % W;
    const y = (((s.y * (H / COSMOS_H) - o.cy * depth * 2.4) % H) + H) % H;
    const tw = o.animated ? 0.55 + 0.45 * Math.sin(t / (o.dreaming ? 1100 : 520) + s.ph) : 1;
    ctx.globalAlpha = tw * (o.dreaming ? 0.7 : 1);
    ctx.fillStyle = o.gold ? GOLD_STARS[s.c] : pal.stars[s.c];
    const size = s.layer === 2 ? 2 : 1;
    ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    if (s.layer === 2 && tw > 0.85) {
      ctx.globalAlpha = 0.35;
      ctx.fillRect(Math.floor(x) - 1, Math.floor(y), 4, 1);
      ctx.fillRect(Math.floor(x), Math.floor(y) - 1, 1, 4);
    }
  }
  ctx.globalAlpha = 1;
}
