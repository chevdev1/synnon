"use client";

import { RNG } from "./rng";
import { hexMask, isEdge, parseKey } from "./hex";
import { drawPrism, makeBuffer, setPx, type PixelBuffer } from "./drawPrism";
import { NODE_PALETTE, HAZE_COLOR, mix, type FamilyName } from "./palette";
import { NW, NH, R0, type BrainModel, type Cell } from "./generate";
import type { NodeStatus } from "./types";

export const SCALE = 2;

export interface ResolvedVisual {
  fam: FamilyName;
  lit: boolean;
  group?: number;
  f: number;
  isUser: boolean;
}

// Cell appearance is generated once for looks (family/idle brightness), but
// per SYNNOD_PROJECT.md 6.8 only *claimable* cells get repainted by real
// status; everything else keeps its generated idle look and is never lit.
export function resolveCellVisual(
  cell: Cell,
  statusMap: Map<number, NodeStatus>,
  currentUserNodeId: number | null
): ResolvedVisual {
  if (cell.claimId == null) {
    return { fam: cell.fam, lit: false, f: cell.f, isUser: false };
  }
  if (currentUserNodeId != null && cell.claimId === currentUserNodeId) {
    return { fam: cell.fam, lit: false, f: cell.f, isUser: true };
  }
  const status = statusMap.get(cell.claimId) ?? "available";
  const group = cell.claimId % 4;
  switch (status) {
    case "active":
      return { fam: cell.claimId % 2 === 0 ? "blue" : "ice", lit: true, group, f: cell.f, isUser: false };
    case "memory":
      return { fam: "lav", lit: true, group, f: cell.f, isUser: false };
    case "featured":
      return { fam: "pink", lit: true, group, f: cell.f, isUser: false };
    case "claimed":
      return { fam: cell.fam, lit: false, f: Math.min(1.3, cell.f * 1.15), isUser: false };
    case "available":
    default:
      return { fam: cell.fam, lit: false, f: cell.f, isUser: false };
  }
}

function cellSeed(cell: Cell): number {
  return Math.trunc(cell.x * 131 + cell.y * 17 + cell.z);
}

function orderKeyOf(c: Cell): number {
  return c.z * 100000 + (c.y + c.x * 0.35);
}

function sortedByDrawOrder(cells: Cell[]): Cell[] {
  return cells.slice().sort((a, b) => orderKeyOf(a) - orderKeyOf(b));
}

function drawNodeFace(buf: PixelBuffer, cell: Cell): void {
  const m = hexMask(cell.x, cell.y, cell.R);
  for (const q of m) {
    const [x, y] = parseKey(q);
    if (!(x >= 0 && x < NW && y >= 0 && y < NH)) continue;
    if (isEdge(m, x, y)) {
      setPx(buf, x, y, NODE_PALETTE.rim[0], NODE_PALETTE.rim[1], NODE_PALETTE.rim[2], 255);
    } else {
      const t = (y - cell.y + cell.R) / (2 * cell.R);
      const c = mix(NODE_PALETTE.faceTop, NODE_PALETTE.faceBottom, t);
      setPx(buf, x, y, c[0], c[1], c[2], 255);
    }
  }
  const m2 = hexMask(cell.x, cell.y, cell.R - 2);
  for (const q of m2) {
    const [x, y] = parseKey(q);
    if (isEdge(m2, x, y)) setPx(buf, x, y, NODE_PALETTE.inner[0], NODE_PALETTE.inner[1], NODE_PALETTE.inner[2], 255);
  }
}

function renderBaseBuffer(
  model: BrainModel,
  statusMap: Map<number, NodeStatus>,
  currentUserNodeId: number | null
): PixelBuffer {
  const buf = makeBuffer(NW, NH);
  for (const g of model.ghosts) {
    const m = hexMask(g.x, g.y, R0);
    for (const q of m) {
      const [x, y] = parseKey(q);
      if (x >= 0 && x < NW && y >= 0 && y < NH && isEdge(m, x, y)) setPx(buf, x, y, 26, 26, 66, 255);
    }
  }
  for (const cell of sortedByDrawOrder(model.cells)) {
    const vis = resolveCellVisual(cell, statusMap, currentUserNodeId);
    const f = vis.lit ? vis.f * 0.7 : vis.f;
    const rr = new RNG(cellSeed(cell));
    const crack = rr.random() < 0.22;
    const stars = rr.choice([0, 1, 1, 2]);
    drawPrism(buf, cell.x, cell.y, cell.R, vis.fam, {
      f,
      depth: cell.depth,
      rng: rr,
      lit: vis.lit,
      crack,
      stars,
    });
    if (vis.isUser) drawNodeFace(buf, cell);
  }
  return buf;
}

function renderHazeBuffer(model: BrainModel): PixelBuffer {
  const buf = makeBuffer(NW, NH);
  for (const cell of model.cells) {
    if (cell.z !== 2) continue;
    const m = hexMask(cell.x, cell.y, cell.R);
    for (const q of m) {
      const [x, y] = parseKey(q);
      if (x >= 0 && x < NW && y >= 0 && y < NH) setPx(buf, x, y, HAZE_COLOR[0], HAZE_COLOR[1], HAZE_COLOR[2], HAZE_COLOR[3]);
    }
  }
  return buf;
}

function renderLitAmbientBuffer(
  model: BrainModel,
  statusMap: Map<number, NodeStatus>,
  currentUserNodeId: number | null
): PixelBuffer {
  const buf = makeBuffer(NW, NH);
  for (const cell of model.cells) {
    const vis = resolveCellVisual(cell, statusMap, currentUserNodeId);
    if (!vis.lit) continue;
    drawPrism(buf, cell.x, cell.y, cell.R, vis.fam, {
      f: 0.8,
      rng: new RNG(cellSeed(cell)),
      lit: true,
      faceOnly: true,
    });
  }
  return buf;
}

function renderGlowGroupBuffer(
  model: BrainModel,
  statusMap: Map<number, NodeStatus>,
  currentUserNodeId: number | null,
  group: number
): PixelBuffer {
  const buf = makeBuffer(NW, NH);
  for (const cell of model.cells) {
    const vis = resolveCellVisual(cell, statusMap, currentUserNodeId);
    if (!vis.lit || vis.group !== group) continue;
    drawPrism(buf, cell.x, cell.y, cell.R, vis.fam, {
      f: 1.0,
      rng: new RNG(cellSeed(cell)),
      lit: true,
      faceOnly: true,
      stars: 2,
    });
  }
  return buf;
}

function renderWaveBuffer(model: BrainModel): PixelBuffer {
  const buf = makeBuffer(NW, NH);
  for (const cell of model.cells) {
    if (!cell.wave) continue;
    drawPrism(buf, cell.x, cell.y, cell.R, "navy", {
      f: cell.f * 1.25,
      rng: new RNG(cellSeed(cell)),
      faceOnly: true,
      stars: 1,
      crack: true,
    });
  }
  return buf;
}

function renderNodeRingBuffer(model: BrainModel, currentUserNodeId: number | null): PixelBuffer | null {
  const cell = model.cells.find((c) => c.claimId != null && c.claimId === currentUserNodeId);
  if (!cell) return null;
  const buf = makeBuffer(NW, NH);
  const m = hexMask(cell.x, cell.y, cell.R + 1.6);
  for (const q of m) {
    const [x, y] = parseKey(q);
    if (x >= 0 && x < NW && y >= 0 && y < NH && isEdge(m, x, y)) {
      setPx(buf, x, y, NODE_PALETTE.rim[0], NODE_PALETTE.rim[1], NODE_PALETTE.rim[2], 255);
    }
  }
  return buf;
}

function renderSparkBuffer(model: BrainModel, seed: number): PixelBuffer {
  const buf = makeBuffer(NW, NH);
  const rr = new RNG(seed);
  const front = model.cells.filter((c) => c.z === 2);
  for (const cell of rr.sample(front, Math.min(40, front.length))) {
    const x = Math.max(1, Math.min(NW - 2, Math.trunc(cell.x + rr.uniform(-4, 4))));
    const y = Math.max(1, Math.min(NH - 2, Math.trunc(cell.y + rr.uniform(-4, 4))));
    const white: [number, number, number, number] = [240, 244, 255, 255];
    const lavender: [number, number, number, number] = [210, 180, 255, 255];
    const col = rr.random() < 0.6 ? white : lavender;
    setPx(buf, x, y, col[0], col[1], col[2], col[3]);
    if (rr.random() < 0.3) {
      for (const [a, b] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        setPx(buf, x + a, y + b, col[0], col[1], col[2], 140);
      }
    }
  }
  return buf;
}

function bufferToCanvas(buf: PixelBuffer): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = buf.width;
  c.height = buf.height;
  const ctx = c.getContext("2d")!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(buf.data), buf.width, buf.height), 0, 0);
  return c;
}

function upscale(small: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = small.width * scale;
  out.height = small.height * scale;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, out.width, out.height);
  return out;
}

function drawAlphaScaled(ctx: CanvasRenderingContext2D, img: CanvasImageSource, strength: number): void {
  let s = strength;
  while (s > 1) {
    ctx.globalAlpha = 1;
    ctx.drawImage(img, 0, 0);
    s -= 1;
  }
  if (s > 0.001) {
    ctx.globalAlpha = s;
    ctx.drawImage(img, 0, 0);
  }
  ctx.globalAlpha = 1;
}

// Port of glow() from brain_reference_generator.py: blur, scale alpha by
// `strength`, and optionally re-composite the crisp source on top.
function applyGlow(sharp: HTMLCanvasElement, blurPx: number, strength: number, keep: boolean): HTMLCanvasElement {
  const w = sharp.width;
  const h = sharp.height;
  const blurred = document.createElement("canvas");
  blurred.width = w;
  blurred.height = h;
  const bctx = blurred.getContext("2d")!;
  bctx.filter = `blur(${blurPx}px)`;
  bctx.drawImage(sharp, 0, 0);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d")!;
  drawAlphaScaled(octx, blurred, strength);
  if (keep) octx.drawImage(sharp, 0, 0);
  return out;
}

export interface BrainLayers {
  width: number;
  height: number;
  staticLayer: HTMLCanvasElement;
  glowGroups: HTMLCanvasElement[]; // 4
  waveLayer: HTMLCanvasElement;
  nodeLayer: HTMLCanvasElement | null;
  sparkLayers: HTMLCanvasElement[]; // 2
}

export function buildBrainLayers(
  model: BrainModel,
  statusMap: Map<number, NodeStatus>,
  currentUserNodeId: number | null
): BrainLayers {
  const hazeGlow = applyGlow(upscale(bufferToCanvas(renderHazeBuffer(model)), SCALE), 22, 1.0, false);
  const litGlow = applyGlow(
    upscale(bufferToCanvas(renderLitAmbientBuffer(model, statusMap, currentUserNodeId)), SCALE),
    12,
    0.55,
    false
  );
  const b = upscale(bufferToCanvas(renderBaseBuffer(model, statusMap, currentUserNodeId)), SCALE);

  const staticLayer = document.createElement("canvas");
  staticLayer.width = b.width;
  staticLayer.height = b.height;
  const sctx = staticLayer.getContext("2d")!;
  sctx.drawImage(hazeGlow, 0, 0);
  sctx.drawImage(litGlow, 0, 0);
  sctx.drawImage(b, 0, 0);

  const glowGroups = [0, 1, 2, 3].map((g) =>
    applyGlow(upscale(bufferToCanvas(renderGlowGroupBuffer(model, statusMap, currentUserNodeId, g)), SCALE), 12, 1.4, true)
  );

  const waveLayer = applyGlow(upscale(bufferToCanvas(renderWaveBuffer(model)), SCALE), 5, 0.5, true);

  const ndBuf = renderNodeRingBuffer(model, currentUserNodeId);
  const nodeLayer = ndBuf ? applyGlow(upscale(bufferToCanvas(ndBuf), SCALE), 7, 1.8, true) : null;

  const sparkLayers = [40, 41].map((seed) => applyGlow(upscale(bufferToCanvas(renderSparkBuffer(model, seed)), SCALE), 3, 1.6, true));

  return {
    width: staticLayer.width,
    height: staticLayer.height,
    staticLayer,
    glowGroups,
    waveLayer,
    nodeLayer,
    sparkLayers,
  };
}

// Analytic point-in-hex-face test (continuous coords) for pointer hit-testing,
// mirroring hexMask's geometry without rasterizing a full pixel set.
export function pointInHexFace(px: number, py: number, cx: number, cy: number, R: number): boolean {
  const S3 = Math.sqrt(3);
  const dx = Math.abs(px - cx);
  const dy = Math.abs(py - cy);
  return dx <= (R * S3) / 2 && dy <= R - dx / S3 && !(dy > R * 0.86 && dx > R * 0.18);
}
