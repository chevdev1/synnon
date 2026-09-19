export default function ActivityLine({ series }: { series: number[] }) {
  const w = 240;
  const h = 40;
  const max = Math.max(...series, 1);
  const step = w / (series.length - 1);
  const pts = series.map((v, i) => [i * step, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible text-[var(--accent)]">
      <defs>
        <linearGradient id="act-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#act-fill)" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="activity-flow"
      />
      <circle cx={lx} cy={ly} r="2.2" fill="var(--lime)" className="status-dot" />
    </svg>
  );
}
