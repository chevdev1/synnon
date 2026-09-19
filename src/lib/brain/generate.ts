import { RNG } from "./rng";
import { shape, CX } from "./shape";
import type { FamilyName } from "./palette";

export const NW = 256;
export const NH = 254;
export const R0 = 8.6;
// Reference uses 1.05; mulberry32's distribution is a bit sparser than
// Python's Mersenne Twister for this lattice, so we tighten spacing slightly
// to reliably clear 128 claimable front cells while keeping visible gaps
// between depth layers.
export const SPACING = 0.95;
const S3 = Math.sqrt(3);
const DEPTH_CHOICES = [4, 5, 6, 6, 7, 8] as const;
const LIT_CYCLE: FamilyName[] = ["ice", "ice", "blue", "blue", "lav", "lav", "lav", "pink"];
export const LIT_COUNT = 26;
export const WAVE_COUNT = 30;
export const GHOST_COUNT = 9;
export const SEED = 9;

export interface Cell {
  id: string; // stable key, "z:row:col"
  z: number; // 0 back, 1 mid, 1.5 recessed front, 2 front
  x: number;
  y: number;
  R: number;
  fam: FamilyName;
  depth: number;
  f: number; // brightness multiplier
  stem: boolean;
  lit?: boolean;
  group?: number; // pulse group 0..3, only when lit
  node?: boolean; // the current-user node marker cell
  wave?: boolean;
  claimId?: number; // 1..128 for claimable front cells
  row: number;
  col: number;
}

export interface Ghost {
  x: number;
  y: number;
}

export interface BrainModel {
  cells: Cell[];
  node: Cell;
  ghosts: Ghost[];
  claimableCount: number;
}

interface LayerDef {
  z: 0 | 1 | 2;
  ox: number;
  oy: number;
  grow: number;
}

const LAYERS: LayerDef[] = [
  { z: 0, ox: 4, oy: 4, grow: 0.0 },
  { z: 1, ox: -1, oy: -1, grow: 0.0 },
  { z: 2, ox: -6, oy: -6, grow: -0.02 },
];

function lattice(rng: RNG, ox: number, oy: number, sp: number) {
  const dx = R0 * S3 * sp;
  const dy = R0 * 1.5 * sp;
  const pts: { x: number; y: number; row: number; col: number }[] = [];
  for (let row = -2; row < 24; row++) {
    for (let col = -2; col < 22; col++) {
      const x = ox + col * dx + (row % 2 !== 0 ? dx / 2 : 0) + rng.uniform(-0.8, 0.8);
      const y = oy + row * dy + rng.uniform(-0.8, 0.8);
      pts.push({ x, y, row, col });
    }
  }
  return pts;
}

export function generateBrain(seed: number = SEED): BrainModel {
  const rng = new RNG(seed);
  const cells: Cell[] = [];

  for (const layer of LAYERS) {
    for (const { x, y, row, col } of lattice(rng, layer.ox, layer.oy, SPACING)) {
      const { inBrain, stem, edge } = shape(x, y, layer.grow);
      if (!(inBrain || stem)) continue;

      let pr: number;
      if (layer.z === 2) pr = stem ? 0.95 : Math.min(0.95, 0.45 + edge * 3);
      else if (layer.z === 1) pr = stem ? 0.8 : 0.75;
      else pr = 1.0;
      if (rng.random() > pr) continue;

      const u = (x - CX) / 110;
      const shade = !stem
        ? 0.55 + 0.45 * Math.max(0, Math.min(1, edge * 2.2))
        : Math.max(0.45, 0.9 - (y - 160) / 140);
      const zf = [0.3, 0.62, 1.0][layer.z];
      const vioP = 0.35 + 1.4 * Math.max(0, 0.25 - edge) + (stem ? 0.25 : 0) + 0.15 * u;
      const fam: FamilyName = rng.random() < vioP ? "violet" : "navy";

      let z: number = layer.z;
      let xx = x;
      let yy = y;
      let ff = zf * shade;
      if (layer.z === 2 && !stem && rng.random() < 0.22) {
        z = 1.5;
        xx -= 3;
        yy -= 3;
        ff *= 0.68;
      }

      cells.push({
        id: `${layer.z}:${row}:${col}`,
        z,
        x: xx,
        y: yy,
        R: R0 * rng.uniform(0.93, 1.06),
        fam,
        depth: rng.choice(DEPTH_CHOICES),
        f: ff,
        stem,
        row,
        col,
      });
    }
  }

  // Lit cells: sampled from bright, non-stem front cells, cycling through
  // the color/pulse-group pattern.
  const litPool = cells.filter((c) => c.z === 2 && c.f > 0.6 && !c.stem);
  rng.shuffle(litPool);
  litPool.slice(0, LIT_COUNT).forEach((c, i) => {
    c.fam = LIT_CYCLE[i % LIT_CYCLE.length];
    c.lit = true;
    c.group = i % 4;
  });

  // User node marker: nearest non-lit front cell to a fixed target point.
  const nodeCandidates = cells.filter((c) => c.z === 2 && !c.lit);
  const node = nodeCandidates.reduce((best, c) => {
    const d = (c.x - 96) ** 2 + (c.y - 62) ** 2;
    const bd = (best.x - 96) ** 2 + (best.y - 62) ** 2;
    return d < bd ? c : best;
  }, nodeCandidates[0]);
  node.node = true;

  // Wave: idle front cells that periodically light up in sequence.
  const idleFront = cells.filter((c) => c.z === 2 && !c.lit && !c.node);
  for (const c of rng.sample(idleFront, Math.min(WAVE_COUNT, idleFront.length))) {
    c.wave = true;
  }

  // Ghosts: faint outlines just outside the silhouette (grow=0.12 minus
  // grow=0.0), plus a few near the stem base.
  const ghosts: Ghost[] = [];
  for (let i = 0; i < GHOST_COUNT; i++) {
    for (let t = 0; t < 50; t++) {
      const x = rng.uniform(10, 246);
      const y = rng.uniform(10, 244);
      const outer = shape(x, y, 0.12);
      const inner = shape(x, y, 0.0);
      if ((outer.inBrain || outer.stem) && !(inner.inBrain || inner.stem)) {
        ghosts.push({ x, y });
        break;
      }
    }
  }
  for (let y = 200; y < 250; y += 22) {
    ghosts.push({ x: CX + 14 + rng.uniform(-30, 30), y });
  }

  // Claimable ids: all front-layer cells (z=2 or the recessed 1.5), ordered
  // by row then column so ids stay stable across regenerations with the same
  // seed. Capped at 128; any extra front cells stay decorative (no id).
  const front = cells
    .filter((c) => c.z === 2 || c.z === 1.5)
    .sort((a, b) => a.row - b.row || a.col - b.col);
  let claimId = 1;
  for (const c of front) {
    if (claimId > 128) break;
    c.claimId = claimId++;
  }

  return { cells, node, ghosts, claimableCount: Math.min(128, front.length) };
}

export function orderKey(c: Cell): number {
  return c.z * 100000 + (c.y + c.x * 0.35);
}
