export const CX = 128;
export const CY = 100;

export interface ShapeResult {
  inBrain: boolean;
  stem: boolean;
  edge: number; // >0 inside the dome silhouette, larger = closer to center
}

// Brain silhouette test, ported from SYNNOD_PROJECT.md section 6.4 /
// brain_reference_generator.py's shape().
export function shape(x: number, y: number, grow = 0): ShapeResult {
  const u = (x - CX) / 110;
  const v = (y - CY) / 80;
  const a = Math.atan2(v, u);
  const r = Math.hypot(u, v);
  const b = 1 + grow + 0.05 * Math.sin(4 * a + 2.2) + 0.04 * Math.sin(9 * a + 0.7) + 0.03 * Math.sin(14 * a + 1.9);
  const top = r < b && v < 0.5 + 0.07 * Math.sin(u * 5 + 1) + (u > -0.3 ? 0.08 : 0) + grow;
  const low = ((u - 0.06) / (0.7 + grow)) ** 2 + ((v - 0.52) / (0.4 + grow)) ** 2 < 1;
  const sc = CX + 14 + 4 * Math.sin((y - 150) / 14);
  const hw = Math.max(13, 26 - (y - 160) * 0.2) + grow * 26;
  const stem = y > 160 && y < 240 && Math.abs(x - sc) < hw;
  return { inBrain: top || low, stem, edge: b - r };
}
