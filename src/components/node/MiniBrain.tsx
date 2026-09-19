"use client";

import { useMemo } from "react";
import { generateBrain, NW, NH, type Cell } from "@/lib/brain/generate";
import { useLive } from "@/lib/live/context";

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

// Where this cell sits in the mind: every cell as a small hexagon, this one lit,
// and lines to the cells whose words fed the same thoughts.
export default function MiniBrain({ id, links }: { id: number; links: number[] }) {
  const { nodes } = useLive();
  const all = useMemo(() => generateBrain().cells, []); // whole silhouette, stem included
  const cells = useMemo(() => all.filter((c): c is Cell & { claimId: number } => c.claimId != null), [all]);
  const status = useMemo(() => new Map(nodes.map((n) => [n.id, n.status])), [nodes]);
  const me = cells.find((c) => c.claimId === id);
  const linked = new Set(links);

  return (
    <svg viewBox={`0 0 ${NW} ${NH}`} className="mx-auto w-full max-w-[420px]" role="img" aria-label={`Node ${id} in the brain${links.length ? `, linked to ${links.length} others` : ""}`}>
      {all.map((c, i) => {
        if (c.claimId == null) return <polygon key={i} points={hex(c.x, c.y, c.R * 0.86)} fill="#0d1236" stroke="#161b44" strokeWidth={0.5} />;
        const taken = (status.get(c.claimId) ?? "available") !== "available";
        const isMe = c.claimId === id;
        const isLink = linked.has(c.claimId);
        return (
          <polygon
            key={i}
            points={hex(c.x, c.y, c.R * 0.86)}
            fill={isMe ? "var(--lime)" : isLink ? "var(--cell-pink)" : taken ? "#2c3478" : "#141a44"}
            stroke={isMe ? "var(--lime)" : isLink ? "var(--cell-pink)" : "#262c5e"}
            strokeWidth={0.6}
            opacity={isMe || isLink ? 1 : 0.9}
          />
        );
      })}
      {me &&
        cells
          .filter((c) => linked.has(c.claimId))
          .map((c) => (
            <line key={`l${c.claimId}`} x1={me.x} y1={me.y} x2={c.x} y2={c.y} stroke="var(--cell-pink)" strokeWidth={0.7} strokeDasharray="2 2" opacity={0.85} />
          ))}
      {me && (
        <polygon points={hex(me.x, me.y, me.R * 1.9)} fill="none" stroke="var(--lime)" strokeWidth={0.8} className="mini-ping" />
      )}
    </svg>
  );
}
