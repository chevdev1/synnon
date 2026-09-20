"use client";

import { useMemo } from "react";
import { generateBrain, NH, NW, type Cell } from "@/lib/brain/generate";
import type { QAnswer } from "@/lib/question";

const COLORS = ["#c4f260", "#6fd6ff", "#ff9be0", "#b9a6f5", "#ffd166", "#7ff0c0"];
export const colorOf = (nodeId: number) => COLORS[nodeId % COLORS.length];

const hex = (cx: number, cy: number, R: number) =>
  [
    [cx - (R * Math.sqrt(3)) / 2, cy - R / 2],
    [cx, cy - R],
    [cx + (R * Math.sqrt(3)) / 2, cy - R / 2],
    [cx + (R * Math.sqrt(3)) / 2, cy + R / 2],
    [cx, cy + R],
    [cx - (R * Math.sqrt(3)) / 2, cy + R / 2],
  ]
    .map((p) => p.map((v) => v.toFixed(1)).join(","))
    .join(" ");

// The brain, drawn as a mosaic: every cell that answered lights up in its own colour;
// tap or click a lit cell to read what it said.
export default function AnswerMosaic({ answers, selected, mineId, onPick }: { answers: QAnswer[]; selected: number | null; mineId: number | null; onPick: (nodeId: number) => void }) {
  const all = useMemo(() => generateBrain().cells, []);
  const byNode = useMemo(() => new Map(answers.map((a) => [a.nodeId, a])), [answers]);

  return (
    <svg viewBox={`0 0 ${NW} ${NH}`} className="mx-auto w-full max-w-[560px]" role="img" aria-label={`Mosaic: ${answers.length} cells have answered`} data-mosaic>
      {all.map((c: Cell, i) => {
        if (c.claimId == null) return <polygon key={i} points={hex(c.x, c.y, c.R * 0.86)} fill="#0d1236" stroke="#161b44" strokeWidth={0.5} />;
        const a = byNode.get(c.claimId);
        const mine = c.claimId === mineId;
        const sel = c.claimId === selected;
        if (!a) return <polygon key={i} points={hex(c.x, c.y, c.R * 0.86)} fill="#141a44" stroke={mine ? "var(--lime)" : "#262c5e"} strokeWidth={mine ? 1.1 : 0.6} />;
        const col = colorOf(c.claimId);
        return (
          <g key={i} onClick={() => onPick(c.claimId!)} style={{ cursor: "pointer" }} data-mosaic-cell={c.claimId}>
            <polygon points={hex(c.x, c.y, c.R * 0.86)} fill={col} opacity={sel ? 1 : 0.78} stroke={sel ? "#fff" : mine ? "var(--lime)" : col} strokeWidth={sel ? 1.3 : mine ? 1.1 : 0.6} />
            {sel && <polygon points={hex(c.x, c.y, c.R * 1.6)} fill="none" stroke="#fff" strokeWidth={0.7} className="mini-ping" />}
          </g>
        );
      })}
    </svg>
  );
}
