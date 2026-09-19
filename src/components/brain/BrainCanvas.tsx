"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useMotion } from "@/lib/motion";
import { generateBrain, NW, NH, R0, SPACING, type Cell } from "@/lib/brain/generate";
import { buildBrainLayers, pointInHexFace, SCALE } from "@/lib/brain/layers";
import { FAM } from "@/lib/brain/palette";
import type { BrainNode, PulseEvent } from "@/lib/brain/types";

export interface BrainCanvasProps {
  nodes: BrainNode[];
  selectedId?: number | null;
  currentUserNodeId?: number | null;
  onSelect?: (id: number) => void;
  pulseEvent?: PulseEvent | null;
  className?: string;
}

const GROUP_PERIODS_MS = [4200, 5600, 3800, 6400];
const WAVE_PERIOD_MS = 6000;
const SCAN_PERIOD_MS = 6000;
const NODE_PULSE_MS = 1800;
const SPARK_PERIODS_MS = [2400, 3100];

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

export default function BrainCanvas({
  nodes,
  selectedId = null,
  currentUserNodeId = null,
  onSelect,
  pulseEvent = null,
  className,
}: BrainCanvasProps) {
  const model = useMemo(() => generateBrain(), []);
  const claimable = useMemo(() => model.cells.filter((c): c is Cell & { claimId: number } => c.claimId != null), [model]);

  const statusMap = useMemo(() => {
    const m = new Map<number, BrainNode["status"]>();
    for (const n of nodes) m.set(n.id, n.status);
    return m;
  }, [nodes]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [focusedId, setFocusedId] = useState<number | null>(selectedId ?? claimable[0]?.claimId ?? null);
  const flashRef = useRef<FlashState | null>(null);
  const { reduced: reducedMotion } = useMotion();

  // Cached raster layers only depend on node statuses and the current
  // user's node, not on animation state, so they're built once per change
  // rather than every frame. Runs client-only (this component is loaded
  // with ssr:false) since it touches document.createElement("canvas").
  const layers = useMemo(
    () => buildBrainLayers(model, statusMap, currentUserNodeId),
    [model, statusMap, currentUserNodeId]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = layers.width;
      canvas.height = layers.height;
    }
  }, [layers]);

  useEffect(() => {
    if (!pulseEvent) return;
    const target = claimable.find((c) => c.claimId === pulseEvent.nodeId);
    if (!target) return;
    flashRef.current = {
      id: pulseEvent.nodeId,
      start: performance.now(),
      rings: computeRings(target, claimable),
    };
  }, [pulseEvent, claimable]);

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

    function frame(t: number) {
      if (cancelled) return;
      const { width, height } = layers;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
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
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = grad;
        ctx.fillRect(0, sy - bandH, width, bandH * 2);
        ctx.globalCompositeOperation = "source-over";
      }

      const flash = flashRef.current;
      const flashTotalMs = ICE_FLASH_MS + RING_COUNT * RING_STAGGER_MS + RING_PULSE_MS;
      if (flash) {
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
      const pts = hexVertices(cx, cy, R);
      c.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
      c.closePath();
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
  }, [layers, reducedMotion, hoveredId, focusedId, claimable]);

  const pickCell = useCallback(
    (clientX: number, clientY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const lx = ((clientX - rect.left) / rect.width) * NW;
      const ly = ((clientY - rect.top) / rect.height) * NH;
      for (let i = claimable.length - 1; i >= 0; i--) {
        const c = claimable[i];
        if (pointInHexFace(lx, ly, c.x, c.y, c.R)) return c.claimId;
      }
      return null;
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
  function handleClick(e: React.PointerEvent<HTMLCanvasElement>) {
    const id = pickCell(e.clientX, e.clientY);
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

  return (
    <div
      ref={wrapRef}
      className={["brain-breathe", className].filter(Boolean).join(" ")}
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
        }}
      />
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
