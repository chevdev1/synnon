"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useMotion } from "@/lib/motion";
import { generateBrain, NW, NH, R0, SPACING, type Cell } from "@/lib/brain/generate";
import { buildBrainLayers, pointInHexFace, SCALE, tintLayers } from "@/lib/brain/layers";
import { TOD_FILTER, useTod } from "@/lib/tod";
import { FAM } from "@/lib/brain/palette";
import type { BrainNode, PulseEvent } from "@/lib/brain/types";

export interface BrainCanvasProps {
  nodes: BrainNode[];
  selectedId?: number | null;
  currentUserNodeId?: number | null;
  ownName?: string | null; // label floated above the visitor's own cell
  onSelect?: (id: number) => void;
  pulseEvent?: PulseEvent | null;
  ping?: { id: number; n: number } | null; // search result: pulses a cell so it is easy to spot
  dreaming?: boolean; // the mind is asleep: slow breath, random memories flicker
  className?: string;
}

const GROUP_PERIODS_MS = [4200, 5600, 3800, 6400];
const WAVE_PERIOD_MS = 6000;
const SCAN_PERIOD_MS = 6000;
const NODE_PULSE_MS = 1800;
const SPARK_PERIODS_MS = [2400, 3100];

const LINK_TRAVEL_MS = 900;
const LINK_STAGGER_MS = 140;
const LINK_LINGER = 1.3; // trail stays this many travel-times after arrival
const CLAIM_WAVE_MS = 1700;
const ASSEMBLE_MS = 1900;
const GLOW_HALF_LIFE_MIN = 70; // how fast a spoken-through cell cools down
const PING_MS = 2400;
const DREAM_EVERY_MS = 2100;
const DREAM_FLASH_MS = 1500;

interface RingCell {
  x: number;
  y: number;
  R: number;
}

interface FlashState {
  id: number;
  start: number;
  rings: RingCell[][]; // index 0 = ring 1 (nearest neighbors), 1 = ring 2, 2 = ring 3
}

interface LinkAnim {
  start: number;
  color: [number, number, number];
  origin: { x: number; y: number };
  targets: { x: number; y: number; R: number; cx: number; cy: number; delay: number }[];
}

const ICE_FLASH_MS = 600;
const RING_STAGGER_MS = 120;
const RING_PULSE_MS = 300;
const RING_COUNT = 3;

// Cells are an irregular hex-ish lattice, not clean axial coordinates, so
// "rings" of neighbors are approximated by Euclidean distance bands using the
// lattice's own spacing as the unit step.
function computeRings(target: RingCell, claimable: (Cell & { claimId: number })[]): RingCell[][] {
  const spacing = R0 * Math.sqrt(3) * SPACING;
  const rings: RingCell[][] = [[], [], []];
  for (const c of claimable) {
    if (c.x === target.x && c.y === target.y) continue;
    const dist = Math.hypot(c.x - target.x, c.y - target.y);
    const ring = Math.round(dist / spacing);
    if (ring >= 1 && ring <= RING_COUNT) rings[ring - 1].push({ x: c.x, y: c.y, R: c.R });
  }
  return rings;
}

function triangularPulse(elapsed: number, duration: number): number {
  const t = Math.max(0, Math.min(1, elapsed / duration));
  return Math.sin(Math.PI * t);
}

function hexVertices(cx: number, cy: number, R: number): [number, number][] {
  return [
    [cx - (R * Math.sqrt(3)) / 2, cy - R / 2],
    [cx, cy - R],
    [cx + (R * Math.sqrt(3)) / 2, cy - R / 2],
    [cx + (R * Math.sqrt(3)) / 2, cy + R / 2],
    [cx, cy + R],
    [cx - (R * Math.sqrt(3)) / 2, cy + R / 2],
  ];
}

// Adds a hexagon to the current path (no beginPath), for batched fills and clips.
function addHex(c: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  hexVertices(cx, cy, R).forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
}

const quad = (ax: number, ay: number, cx: number, cy: number, bx: number, by: number, u: number): [number, number] => {
  const m = 1 - u;
  return [m * m * ax + 2 * m * u * cx + u * u * bx, m * m * ay + 2 * m * u * cy + u * u * by];
};

export default function BrainCanvas({
  nodes,
  selectedId = null,
  currentUserNodeId = null,
  ownName = null,
  onSelect,
  pulseEvent = null,
  ping = null,
  dreaming = false,
  className,
}: BrainCanvasProps) {
  const model = useMemo(() => generateBrain(), []);
  const claimable = useMemo(() => model.cells.filter((c): c is Cell & { claimId: number } => c.claimId != null), [model]);

  // Assembly order: cells appear from the centre outwards with a little noise.
  const reveal = useMemo(() => {
    const cx = NW / 2;
    const cy = NH / 2;
    let maxD = 1;
    for (const c of model.cells) maxD = Math.max(maxD, Math.hypot(c.x - cx, c.y - cy));
    return model.cells.map((c, i) => 0.78 * (Math.hypot(c.x - cx, c.y - cy) / maxD) + 0.22 * (((i * 2654435761) >>> 0) / 4294967296));
  }, [model]);

  // The cached raster layers depend only on who holds what status. A stable string
  // key keeps them from being rebuilt (an expensive step) when only `lastActiveAt`
  // or an identical refetch changes the nodes array.
  const statusKey = useMemo(() => nodes.map((n) => `${n.id}:${n.status}`).join("|"), [nodes]);
  const statusMap = useMemo(() => {
    const m = new Map<number, BrainNode["status"]>();
    if (statusKey) for (const part of statusKey.split("|")) {
      const [id, st] = part.split(":");
      m.set(Number(id), st as BrainNode["status"]);
    }
    return m;
  }, [statusKey]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(selectedId ?? claimable[0]?.claimId ?? null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const flashRef = useRef<FlashState | null>(null);
  const linksRef = useRef<LinkAnim[]>([]);
  const claimWaveRef = useRef<{ x: number; y: number; start: number } | null>(null);
  const dreamRef = useRef<{ id: number; start: number }[]>([]);
  const pingRef = useRef<{ id: number; start: number } | null>(null);
  const introRef = useRef<{ start: number | null; done: boolean }>({ start: null, done: false });
  const nodesRef = useRef(nodes);
  const dreamingRef = useRef(dreaming);
  const { reduced: reducedMotion } = useMotion();

  useEffect(() => {
    nodesRef.current = nodes;
    dreamingRef.current = dreaming;
  }, [nodes, dreaming]);

  // Cached raster layers only depend on node statuses and the current
  // user's node, not on animation state, so they're built once per change
  // rather than every frame. Runs client-only (this component is loaded
  // with ssr:false) since it touches document.createElement("canvas").
  const { phase } = useTod();
  const baseLayers = useMemo(
    () => buildBrainLayers(model, statusMap, currentUserNodeId),
    [model, statusMap, currentUserNodeId]
  );
  const layers = useMemo(() => tintLayers(baseLayers, TOD_FILTER[phase]), [baseLayers, phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = layers.width;
      canvas.height = layers.height;
    }
  }, [layers]);

  // Track the drawn size so HTML labels can sit exactly over a cell.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The brain assembles itself once the visitor is past the intro screen.
  useEffect(() => {
    const ir = introRef.current;
    if (ir.done || ir.start != null) return;
    let entered = false;
    try {
      entered = window.sessionStorage.getItem("synnod-entered") === "1";
    } catch {
      /* ignore */
    }
    if (entered) {
      ir.start = performance.now();
      return;
    }
    const go = () => {
      ir.start = performance.now();
    };
    window.addEventListener("synnod:entered", go, { once: true });
    return () => window.removeEventListener("synnod:entered", go);
  }, []);

  useEffect(() => {
    if (!pulseEvent) return;
    const target = claimable.find((c) => c.claimId === pulseEvent.nodeId);
    if (!target) return;
    // start = -1: the frame loop stamps the time of the first frame it actually draws,
    // so a long main-thread stall (layers rebuilding after a status change) can't eat the animation.
    const t0 = -1;
    flashRef.current = { id: pulseEvent.nodeId, start: t0, rings: computeRings(target, claimable) };

    if (pulseEvent.type === "claim") {
      claimWaveRef.current = { x: target.x * SCALE, y: target.y * SCALE, start: t0 };
      return;
    }
    // Neural links: from the speaking cell to the cells whose words it echoes.
    const taken = (id: number) => {
      const s = nodesRef.current.find((n) => n.id === id)?.status;
      return !!s && s !== "available";
    };
    let ids = (pulseEvent.links ?? []).filter((id) => id !== pulseEvent.nodeId);
    if (ids.length === 0) {
      const near = claimable
        .filter((c) => c.claimId !== pulseEvent.nodeId && taken(c.claimId))
        .sort((a, b) => Math.hypot(a.x - target.x, a.y - target.y) - Math.hypot(b.x - target.x, b.y - target.y))
        .slice(0, 10);
      ids = near.sort(() => Math.random() - 0.5).slice(0, 3).map((c) => c.claimId);
    }
    const targets = ids
      .map((id) => claimable.find((c) => c.claimId === id))
      .filter((c): c is Cell & { claimId: number } => !!c)
      .map((c, i) => {
        const ax = target.x * SCALE;
        const ay = target.y * SCALE;
        const bx = c.x * SCALE;
        const by = c.y * SCALE;
        const d = Math.hypot(bx - ax, by - ay) || 1;
        const bend = (Math.random() < 0.5 ? -1 : 1) * d * 0.22;
        return { x: bx, y: by, R: c.R, cx: (ax + bx) / 2 + (-(by - ay) / d) * bend, cy: (ay + by) / 2 + ((bx - ax) / d) * bend, delay: i * LINK_STAGGER_MS };
      });
    if (targets.length === 0) return;
    linksRef.current = [
      ...linksRef.current.slice(-4),
      { start: t0, color: pulseEvent.type === "thought" ? [196, 242, 96] : [150, 225, 255], origin: { x: target.x * SCALE, y: target.y * SCALE }, targets },
    ];
  }, [pulseEvent, claimable]);

  useEffect(() => {
    if (!ping) return;
    pingRef.current = { id: ping.id, start: -1 };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFocusedId(ping.id);
  }, [ping]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext("2d");
    if (!rawCtx) return;
    // Re-typed as non-null so it stays non-null when captured by the nested
    // function declarations below (TS doesn't carry the narrowing above into
    // hoisted function bodies).
    const ctx: CanvasRenderingContext2D = rawCtx;
    ctx.imageSmoothingEnabled = false;

    let raf = 0;
    let cancelled = false;
    let lastDream = 0;

    function frame(t: number) {
      if (cancelled) return;
      const { width, height } = layers;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // ---- assembly: only revealed cells are drawn, with a bright construction front ----
      const ir = introRef.current;
      let progress = 1;
      if (!ir.done) {
        if (reducedMotion) ir.done = true;
        else if (ir.start == null) progress = 0;
        else {
          progress = Math.min(1, (t - ir.start) / ASSEMBLE_MS);
          if (progress >= 1) ir.done = true;
        }
      }
      const assembling = progress < 1;
      if (assembling) {
        ctx.save();
        ctx.beginPath();
        model.cells.forEach((c, i) => {
          if (reveal[i] <= progress * 1.02) addHex(ctx, c.x * SCALE, c.y * SCALE, c.R * SCALE * 1.2);
        });
        ctx.clip();
      }

      ctx.drawImage(layers.staticLayer, 0, 0);

      for (let g = 0; g < 4; g++) {
        const alpha = reducedMotion
          ? 0.6
          : 0.1 + 0.9 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / GROUP_PERIODS_MS[g] + g * 1.7));
        ctx.globalAlpha = alpha;
        ctx.drawImage(layers.glowGroups[g], 0, 0);
      }
      ctx.globalAlpha = 1;

      if (!reducedMotion) {
        const cyclePos = (t % WAVE_PERIOD_MS) / WAVE_PERIOD_MS;
        const waveAlpha = Math.max(0, Math.sin(cyclePos * Math.PI) * 0.9);
        ctx.globalAlpha = waveAlpha;
        ctx.drawImage(layers.waveLayer, 0, 0);
        ctx.globalAlpha = 1;
      }

      // ---- memory age: a cell that just spoke glows and cools down over a couple of hours ----
      const nowMs = Date.now();
      ctx.globalCompositeOperation = "lighter";
      for (const c of claimable) {
        const n = nodesRef.current.find((x) => x.id === c.claimId);
        if (!n || n.status === "available") continue;
        const ageMin = n.lastActiveAt ? (nowMs - n.lastActiveAt) / 60000 : Infinity;
        let k = ageMin === Infinity ? 0.05 : Math.pow(0.5, ageMin / GLOW_HALF_LIFE_MIN);
        if (ageMin < 1 && !reducedMotion) k *= 1 + 0.35 * Math.sin(t / 160);
        if (k < 0.03) continue;
        ctx.fillStyle = n.status === "active" ? `rgba(196,242,96,${(k * 0.34).toFixed(3)})` : `rgba(150,210,255,${(k * 0.3).toFixed(3)})`;
        ctx.beginPath();
        addHex(ctx, c.x * SCALE, c.y * SCALE, c.R * SCALE * 0.95);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      const sparkAlphas = reducedMotion
        ? [1, 1]
        : SPARK_PERIODS_MS.map((p) => (Math.floor(t / p) % 2 === 0 ? 1 : 0));
      layers.sparkLayers.forEach((layer, i) => {
        ctx.globalAlpha = sparkAlphas[i];
        ctx.drawImage(layer, 0, 0);
      });
      ctx.globalAlpha = 1;

      if (layers.nodeLayer) {
        const ringAlpha = reducedMotion
          ? 0.6
          : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin((2 * Math.PI * t) / NODE_PULSE_MS));
        ctx.globalAlpha = ringAlpha;
        ctx.drawImage(layers.nodeLayer, 0, 0);
        ctx.globalAlpha = 1;
      }

      if (!reducedMotion) {
        const sy = ((t % SCAN_PERIOD_MS) / SCAN_PERIOD_MS) * height;
        const bandH = height * 0.18;
        const grad = ctx.createLinearGradient(0, sy - bandH, 0, sy + bandH);
        grad.addColorStop(0, "rgba(140,120,255,0)");
        grad.addColorStop(0.5, "rgba(140,120,255,0.07)");
        grad.addColorStop(1, "rgba(140,120,255,0)");
        // source-atop: the band only tints what is already drawn (the brain and its haze),
        // so it has no visible rectangle edges at the canvas border
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = grad;
        ctx.fillRect(0, sy - bandH, width, bandH * 2);
        ctx.globalCompositeOperation = "source-over";
      }

      if (assembling) {
        // the construction front: freshly revealed cells flash lime
        ctx.strokeStyle = "rgba(196,242,96,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        model.cells.forEach((c, i) => {
          if (reveal[i] <= progress * 1.02 && reveal[i] > progress - 0.09) addHex(ctx, c.x * SCALE, c.y * SCALE, c.R * SCALE);
        });
        ctx.stroke();
        ctx.restore();
      }

      // ---- dreaming: forgotten memories flicker up at random ----
      if (dreamingRef.current && !reducedMotion && !assembling) {
        if (t - lastDream > DREAM_EVERY_MS) {
          lastDream = t;
          const pool = claimable.filter((c) => {
            const s = nodesRef.current.find((n) => n.id === c.claimId)?.status;
            return s && s !== "available";
          });
          const from = pool.length > 0 ? pool : claimable;
          dreamRef.current.push({ id: from[Math.floor(Math.random() * from.length)].claimId, start: t });
        }
      }
      if (dreamRef.current.length > 0) {
        dreamRef.current = dreamRef.current.filter((d) => t - d.start < DREAM_FLASH_MS);
        ctx.globalCompositeOperation = "lighter";
        for (const d of dreamRef.current) {
          const c = claimable.find((x) => x.claimId === d.id);
          if (!c) continue;
          const p = (t - d.start) / DREAM_FLASH_MS;
          ctx.fillStyle = `rgba(185,166,245,${(0.55 * Math.sin(Math.PI * p)).toFixed(3)})`;
          ctx.beginPath();
          addHex(ctx, c.x * SCALE, c.y * SCALE, c.R * SCALE * (1 + p * 0.5));
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // ---- neural links: sparks travel from a speaking cell to the cells it echoes ----
      if (linksRef.current.length > 0) {
        ctx.globalCompositeOperation = "lighter";
        linksRef.current = linksRef.current.filter((L) => {
          if (L.start < 0) L.start = t;
          const el = t - L.start;
          const [r, g, b] = L.color;
          let alive = false;
          for (const tg of L.targets) {
            const p = (el - tg.delay) / LINK_TRAVEL_MS;
            if (p < 0) {
              alive = true;
              continue;
            }
            const fade = p < 1 ? 1 : Math.max(0, 1 - (p - 1) / LINK_LINGER);
            if (fade <= 0) continue;
            alive = true;
            const head = Math.min(1, p);
            const steps = 28;
            for (let i = 0; i <= steps * head; i++) {
              const u = i / steps;
              const [x, y] = quad(L.origin.x, L.origin.y, tg.cx, tg.cy, tg.x, tg.y, u);
              ctx.fillStyle = `rgba(${r},${g},${b},${(fade * (0.3 + 0.6 * (head > 0 ? u / head : 0))).toFixed(3)})`;
              ctx.fillRect(Math.round(x / 2) * 2 - 1, Math.round(y / 2) * 2 - 1, 3, 3);
            }
            if (p < 1) {
              const [x, y] = quad(L.origin.x, L.origin.y, tg.cx, tg.cy, tg.x, tg.y, head);
              ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
              ctx.fillRect(Math.round(x) - 4, Math.round(y) - 4, 8, 8);
              ctx.fillStyle = "rgba(255,255,255,0.95)";
              ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
            } else {
              const ar = (p - 1) / 0.55;
              if (ar < 1) {
                ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - ar).toFixed(3)})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                addHex(ctx, tg.x, tg.y, (tg.R + 1 + ar * 4) * SCALE);
                ctx.stroke();
              }
            }
          }
          return alive;
        });
        ctx.globalCompositeOperation = "source-over";
      }

      // ---- a cell was claimed: a shockwave rolls across the whole brain ----
      const wave = claimWaveRef.current;
      if (wave) {
        if (wave.start < 0) wave.start = t;
        const el = t - wave.start;
        if (el > CLAIM_WAVE_MS) claimWaveRef.current = null;
        else {
          const maxR = Math.hypot(width, height) * 0.7;
          // source-atop again: the wave travels through the brain instead of being cut off by the canvas edge
          ctx.globalCompositeOperation = "source-atop";
          if (el < 700) {
            ctx.fillStyle = `rgba(196,242,96,${(0.07 * (1 - el / 700)).toFixed(3)})`;
            ctx.fillRect(0, 0, width, height);
          }
          for (let k = 0; k < 3; k++) {
            const e = el - k * 220;
            if (e < 0) continue;
            const life = Math.max(0, 1 - e / (CLAIM_WAVE_MS - 200));
            const rad = (e / (CLAIM_WAVE_MS - 200)) * maxR;
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, rad, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(196,242,96,${(life * 0.16).toFixed(3)})`; // soft wide halo
            ctx.lineWidth = 26 - k * 6;
            ctx.stroke();
            ctx.strokeStyle = `rgba(214,255,140,${Math.min(1, life * 1.1).toFixed(3)})`; // crisp leading edge
            ctx.lineWidth = 8 - k * 2;
            ctx.stroke();
          }
          ctx.globalCompositeOperation = "source-over";
        }
      }

      const flash = flashRef.current;
      const flashTotalMs = ICE_FLASH_MS + RING_COUNT * RING_STAGGER_MS + RING_PULSE_MS;
      if (flash) {
        if (flash.start < 0) flash.start = t;
        const elapsed = t - flash.start;
        if (elapsed > flashTotalMs) {
          flashRef.current = null;
        } else {
          const cell = claimable.find((c) => c.claimId === flash.id);
          if (cell) {
            if (elapsed < ICE_FLASH_MS) {
              const alpha = triangularPulse(elapsed, ICE_FLASH_MS);
              const ice = FAM.ice;
              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.fillStyle = `rgb(${ice.ft[0]},${ice.ft[1]},${ice.ft[2]})`;
              drawHexPath(ctx, cell.x * SCALE, cell.y * SCALE, cell.R * SCALE);
              ctx.fill();
              ctx.strokeStyle = "rgba(230,248,255,0.95)";
              ctx.lineWidth = 2;
              drawHexPath(ctx, cell.x * SCALE, cell.y * SCALE, (cell.R + 2) * SCALE);
              ctx.stroke();
              ctx.restore();
            }
          }

          for (let r = 0; r < RING_COUNT; r++) {
            const ringStart = ICE_FLASH_MS + r * RING_STAGGER_MS;
            const ringElapsed = elapsed - ringStart;
            if (ringElapsed < 0 || ringElapsed > RING_PULSE_MS) continue;
            const alpha = triangularPulse(ringElapsed, RING_PULSE_MS) * (1 - r * 0.22);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "rgba(196,242,96,0.85)";
            ctx.lineWidth = 1.5;
            for (const rc of flash.rings[r]) {
              drawHexPath(ctx, rc.x * SCALE, rc.y * SCALE, (rc.R + 1) * SCALE);
              ctx.stroke();
            }
            ctx.restore();
          }
        }
      }

      // ---- search ping: three expanding pink outlines around the cell that was looked up ----
      const pg = pingRef.current;
      if (pg) {
        if (pg.start < 0) pg.start = t;
        const el = t - pg.start;
        const c = claimable.find((x) => x.claimId === pg.id);
        if (!c || el > PING_MS) pingRef.current = null;
        else {
          for (let k = 0; k < 3; k++) {
            const e = (el - k * 380) / 1100;
            if (e < 0 || e > 1) continue;
            ctx.strokeStyle = `rgba(255,155,224,${(1 - e).toFixed(3)})`;
            ctx.lineWidth = 2.5;
            drawHexPath(ctx, c.x * SCALE, c.y * SCALE, (c.R + 2 + e * 14) * SCALE);
            ctx.stroke();
          }
          ctx.strokeStyle = "rgba(255,155,224,0.95)";
          ctx.lineWidth = 2;
          drawHexPath(ctx, c.x * SCALE, c.y * SCALE, (c.R + 1.5) * SCALE);
          ctx.stroke();
        }
      }

      const outlineId = hoveredId ?? focusedId;
      if (outlineId != null) {
        const cell = claimable.find((c) => c.claimId === outlineId);
        if (cell) {
          ctx.save();
          ctx.strokeStyle = outlineId === hoveredId ? "rgba(185,166,245,0.95)" : "rgba(108,95,214,0.85)";
          ctx.lineWidth = 2;
          drawHexPath(ctx, cell.x * SCALE, cell.y * SCALE, (cell.R + 1.5) * SCALE);
          ctx.stroke();
          ctx.restore();
        }
      }

      raf = requestAnimationFrame(frame);
    }

    function drawHexPath(c: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
      c.beginPath();
      addHex(c, cx, cy, R);
    }

    function loop(t: number) {
      if (document.hidden) {
        raf = requestAnimationFrame(loop);
        return;
      }
      frame(t);
    }

    raf = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [layers, reducedMotion, hoveredId, focusedId, claimable, model, reveal]);

  const pickCell = useCallback(
    (clientX: number, clientY: number, snap = false): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const lx = ((clientX - rect.left) / rect.width) * NW;
      const ly = ((clientY - rect.top) / rect.height) * NH;
      for (let i = claimable.length - 1; i >= 0; i--) {
        const c = claimable[i];
        if (pointInHexFace(lx, ly, c.x, c.y, c.R)) return c.claimId;
      }
      if (!snap) return null;
      // A fingertip is far bigger than a cell and lands in the gaps between them:
      // on touch, take the nearest cell instead of missing.
      let best: number | null = null;
      let bestD = Infinity;
      for (const c of claimable) {
        const d = Math.hypot(lx - c.x, ly - c.y);
        if (d < c.R * 2.2 && d < bestD) {
          bestD = d;
          best = c.claimId;
        }
      }
      return best;
    },
    [claimable]
  );

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    setHoveredId(pickCell(e.clientX, e.clientY));
    const wrap = wrapRef.current?.getBoundingClientRect();
    if (wrap) setHoverPos({ x: e.clientX - wrap.left, y: e.clientY - wrap.top });
  }
  function handlePointerLeave() {
    setHoveredId(null);
    setHoverPos(null);
  }
  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const type = (e.nativeEvent as PointerEvent).pointerType;
    const id = pickCell(e.clientX, e.clientY, type === "touch" || type === "pen");
    if (id != null) {
      setFocusedId(id);
      onSelect?.(id);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    if (focusedId == null) return;
    const current = claimable.find((c) => c.claimId === focusedId);
    if (!current) return;
    let dx = 0;
    let dy = 0;
    if (e.key === "ArrowLeft") dx = -1;
    else if (e.key === "ArrowRight") dx = 1;
    else if (e.key === "ArrowUp") dy = -1;
    else if (e.key === "ArrowDown") dy = 1;
    else if (e.key === "Enter" || e.key === " ") {
      onSelect?.(focusedId);
      e.preventDefault();
      return;
    } else return;

    e.preventDefault();
    let best: (typeof claimable)[number] | null = null;
    let bestScore = Infinity;
    for (const c of claimable) {
      if (c.claimId === focusedId) continue;
      const vx = c.x - current.x;
      const vy = c.y - current.y;
      const dot = vx * dx + vy * dy;
      if (dot <= 0) continue;
      const dist = Math.hypot(vx, vy);
      const score = dist / (dot / dist);
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (best) setFocusedId(best.claimId);
  }

  // Where a cell sits inside the (letterboxed) canvas, in CSS pixels of the wrapper.
  const place = (id: number) => {
    const c = claimable.find((x) => x.claimId === id);
    if (!c || !size) return null;
    const s = Math.min(size.w / layers.width, size.h / layers.height);
    return {
      left: (size.w - layers.width * s) / 2 + c.x * SCALE * s,
      top: (size.h - layers.height * s) / 2 + c.y * SCALE * s,
      r: c.R * SCALE * s,
    };
  };
  const mine = currentUserNodeId != null ? place(currentUserNodeId) : null;

  return (
    <div
      ref={wrapRef}
      className={["brain-breathe", dreaming ? "brain-dream" : "", className].filter(Boolean).join(" ")}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        role="application"
        aria-label="SYNNOD brain — 128 claimable nodes"
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        // Over a cell the global pixel cursor switches from the reticle to the lock (see globals.css).
        className={hoveredId != null ? "cursor-cell" : undefined}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          imageRendering: "pixelated",
          outline: "none",
          touchAction: "manipulation",
        }}
      />
      {mine && (
        <div
          data-own-label
          className="font-head pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
          style={{ left: mine.left, top: mine.top - mine.r * 1.15 }}
        >
          <span className="whitespace-nowrap border-2 border-[var(--lime)] bg-[#080a20]/90 px-1.5 py-1 text-[7px] uppercase text-[var(--lime)] shadow-[0_0_10px_rgba(196,242,96,0.35)]">
            {ownName && ownName !== "you" ? `you · ${ownName.length > 14 ? ownName.slice(0, 13) + "…" : ownName}` : "you"}
          </span>
          <span className="own-arrow text-[8px] leading-none text-[var(--lime)]">▼</span>
        </div>
      )}
      {hoveredId != null && hoverPos && (
        <div
          className="font-head pointer-events-none absolute z-20 whitespace-nowrap border-2 border-[#3a4180] bg-[#080a20]/95 px-2 py-1.5 text-[8px] uppercase text-[#d9ddec] shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
          style={{ left: hoverPos.x + 14, top: hoverPos.y + 14 }}
        >
          Node {String(hoveredId).padStart(2, "0")} ·{" "}
          <span className={hoveredId === currentUserNodeId ? "text-[#c4f260]" : "text-[#b9a6f5]"}>
            {hoveredId === currentUserNodeId ? "your node" : (statusMap.get(hoveredId) ?? "available")}
          </span>
        </div>
      )}
      <ul style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        {claimable.map((c) => (
          <li key={c.claimId}>
            <button type="button" onClick={() => onSelect?.(c.claimId)}>
              Node {c.claimId} — {statusMap.get(c.claimId) ?? "available"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
