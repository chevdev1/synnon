import { hexMask, isEdge, parseKey, key } from "./hex";
import { FAM, mix, dim, type FamilyName } from "./palette";
import type { RNG } from "./rng";

export const EXTRUDE = { dx: -0.5, dy: -0.62 };

export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA, length = width*height*4
}

export function makeBuffer(width: number, height: number): PixelBuffer {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

export function setPx(buf: PixelBuffer, x: number, y: number, r: number, g: number, b: number, a: number): void {
  if (x < 0 || y < 0 || x >= buf.width || y >= buf.height) return;
  const i = (y * buf.width + x) * 4;
  buf.data[i] = r;
  buf.data[i + 1] = g;
  buf.data[i + 2] = b;
  buf.data[i + 3] = a;
}

export interface DrawPrismOpts {
  f?: number;
  depth?: number;
  rng: RNG;
  lit?: boolean;
  faceOnly?: boolean;
  crack?: boolean;
  stars?: number;
}

// Direct port of draw_prism() from brain_reference_generator.py.
export function drawPrism(
  buf: PixelBuffer,
  cx: number,
  cy: number,
  R: number,
  famName: FamilyName,
  opts: DrawPrismOpts
): Set<string> {
  const p = FAM[famName];
  const f = opts.f ?? 1.0;
  const depth = opts.depth ?? 4;
  const rr = opts.rng;
  const lit = opts.lit ?? false;
  const faceOnly = opts.faceOnly ?? false;
  const crack = opts.crack ?? false;
  const stars = opts.stars ?? 1;
  const W = buf.width;
  const H = buf.height;

  const front = hexMask(cx, cy, R);

  if (!faceOnly) {
    const band = new Map<string, number>();
    for (let t = depth; t >= 1; t--) {
      const bm = hexMask(cx + EXTRUDE.dx * t, cy + EXTRUDE.dy * t, R);
      for (const q of bm) {
        if (front.has(q)) continue;
        band.set(q, t);
      }
    }
    const backm = hexMask(cx + EXTRUDE.dx * depth, cy + EXTRUDE.dy * depth, R);
    for (const [q] of band) {
      const [qx, qy] = parseKey(q);
      if (!(qx >= 0 && qx < W && qy >= 0 && qy < H)) continue;
      const ang = (Math.atan2(qy + 0.5 - cy, qx + 0.5 - cx) * 180) / Math.PI;
      let c = ang > -150 && ang < -25 ? p.st : p.sl;
      if (backm.has(q) && isEdge(backm, qx, qy)) c = mix(c, p.rim2, 0.55);
      const [r, g, b] = dim(c, f);
      setPx(buf, qx, qy, r, g, b, 255);
    }
  }

  for (const q of front) {
    const [qx, qy] = parseKey(q);
    if (!(qx >= 0 && qx < W && qy >= 0 && qy < H)) continue;
    const t = (qy - (cy - R)) / (2 * R);
    let c = mix(p.ft, p.fb, Math.max(0, Math.min(1, t)));
    if (rr.random() < 0.18) c = dim(c, 1.08);
    if (lit) {
      const d = Math.hypot(qx + 0.5 - cx, qy + 0.5 - cy) / R;
      c = mix(c, p.rim, Math.max(0, 0.45 - d) * 1.1);
    }
    if (isEdge(front, qx, qy)) {
      const ang = (Math.atan2(qy + 0.5 - cy, qx + 0.5 - cx) * 180) / Math.PI;
      c = ang < -20 || ang > 150 ? p.rim : p.rim2;
    }
    const [r, g, b] = dim(c, f);
    setPx(buf, qx, qy, r, g, b, 255);
  }

  const inner: [number, number][] = [];
  for (const q of front) {
    const [qx, qy] = parseKey(q);
    if (!(qx >= 0 && qx < W && qy >= 0 && qy < H)) continue;
    let ok = true;
    for (const a of [-2, 2]) {
      for (const b of [-2, 2]) {
        if (!front.has(key(qx + a, qy + b))) ok = false;
      }
    }
    if (ok) inner.push([qx, qy]);
  }

  if (crack && inner.length > 0) {
    let [x, y] = rr.choice(inner);
    const n = rr.randint(3, 6);
    for (let i = 0; i < n; i++) {
      if (front.has(key(x, y))) {
        const [r, g, b] = dim(p.crack, f * 0.9);
        setPx(buf, x, y, r, g, b, 255);
      }
      y += 1;
      x += rr.choice([0, 0, 1, -1]);
    }
  }

  for (const [x, y] of rr.sample(inner, Math.min(stars, inner.length))) {
    const [r, g, b] = dim(p.sp, f);
    setPx(buf, x, y, r, g, b, 255);
  }

  return front;
}
