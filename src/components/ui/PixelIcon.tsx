export function HexIcon({ size = 16, color = "var(--lime)", dot = true }: { size?: number; color?: string; dot?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      <polygon points="4,1 12,1 15,8 12,15 4,15 1,8" fill="none" stroke={color} strokeWidth="1.4" />
      {dot && <rect x="7" y="7" width="2" height="2" fill={color} />}
    </svg>
  );
}

export function LegendHex({ fill, outline }: { fill: string; outline?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      <polygon
        points="4,1 12,1 15,8 12,15 4,15 1,8"
        fill={fill}
        stroke={outline ?? fill}
        strokeWidth="1.2"
      />
    </svg>
  );
}

const MEMORY_ICON_PATHS: Record<string, string> = {
  rain: "M4 2h8v6H4z M3 10l2 4 M7 10l2 4 M11 10l2 4",
  city: "M2 14V6h3V3h3v3h3v4h3v4z",
  cup: "M4 3h8v6a4 4 0 0 1-8 0z M12 5h2v3h-2z M5 14h6",
  galaxy: "M8 8m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0 M8 3v2 M8 11v2 M3 8h2 M11 8h2",
  eye: "M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
};

export function MemoryIcon({ type, size = 20 }: { type: string; size?: number }) {
  const d = MEMORY_ICON_PATHS[type] ?? MEMORY_ICON_PATHS.eye;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
      className="shrink-0"
    >
      <rect x="0" y="0" width="16" height="16" rx="2" fill="var(--cell-idle)" />
      <path d={d} stroke="var(--link)" strokeWidth="1" fill="none" />
    </svg>
  );
}
