import { ImageResponse } from "next/og";
import { getNodeProfile } from "@/server/nodeProfile";
import { generateBrain, NW, NH, type Cell } from "@/lib/brain/generate";

export const alt = "A SYNNOD node";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const STATUS_COLOR: Record<string, string> = { available: "#7a82a8", claimed: "#ffd166", active: "#c4f260", memory: "#b9a6f5", featured: "#ff9be0" };

const hexPts = (cx: number, cy: number, R: number) =>
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

// The card people see when a node link is shared: the brain with this cell lit,
// plus the numbers. Falls back to a plain card when there is no database
// (e.g. the demo deployment), so a shared link never breaks.
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  let status = "available";
  let owner: string | null = null;
  let stats: { voices: number; thoughtsShaped: number; sharePct: number } | null = null;
  try {
    const p = await getNodeProfile(id);
    if (p) {
      status = p.node.status;
      owner = p.node.ownerName;
      stats = p.stats;
    }
  } catch {
    /* no backend here */
  }
  const color = STATUS_COLOR[status] ?? "#7a82a8";
  const all = generateBrain().cells; // whole silhouette, including the stem; only claimable cells are bright
  const cells = all.filter((c): c is Cell & { claimId: number } => c.claimId != null);
  const label = String(id).padStart(2, "0");
  const scale = 500 / NW;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(160deg,#0a0b26,#06071a 60%,#14082c)", color: "#d9ddec", fontFamily: "monospace", padding: 56 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="44" height="44" viewBox="0 0 16 16">
              <polygon points="4,1 12,1 15,8 12,15 4,15 1,8" fill="none" stroke="#c4f260" strokeWidth="1.4" />
              <rect x="7" y="7" width="2" height="2" fill="#c4f260" />
            </svg>
            <div style={{ fontSize: 34, letterSpacing: 10, fontWeight: 700 }}>SYNNOD</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 30, color: "#7a82a8", letterSpacing: 4 }}>{"// NODE"}</div>
            <div style={{ display: "flex", fontSize: 150, fontWeight: 800, color, lineHeight: 1 }}>{label}</div>
            <div style={{ display: "flex", fontSize: 34, marginTop: 14, color: "#aab0cc" }}>
              {owner ? owner : status === "available" ? "still free. claim it." : "a voice of the mind"}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 30 }}>
            {stats ? (
              <>
                {[
                  [String(stats.voices), "VOICES"],
                  [String(stats.thoughtsShaped), "THOUGHTS SHAPED"],
                  [`${stats.sharePct}%`, "OF THE MIND"],
                ].map(([v, l]) => (
                  <div key={l} style={{ display: "flex", flexDirection: "column", flexShrink: 0, marginRight: 48 }}>
                    <span style={{ color: "#c4f260", fontSize: 54, fontWeight: 700 }}>{v}</span>
                    <span style={{ color: "#7a82a8", fontSize: 22, whiteSpace: "nowrap" }}>{l}</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ display: "flex", color: "#b9a6f5", fontSize: 36 }}>128 voices. One mind.</div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 520 }}>
          <svg width={500} height={NH * scale} viewBox={`0 0 ${NW} ${NH}`}>
            {all.map((c, i) => (
              <polygon
                key={i}
                points={hexPts(c.x, c.y, c.R * 0.86)}
                fill={c.claimId === id ? color : c.claimId != null ? "#1c2360" : "#0f1438"}
                stroke={c.claimId === id ? color : c.claimId != null ? "#262c5e" : "#181d4a"}
                strokeWidth={0.6}
              />
            ))}
            {cells
              .filter((c) => c.claimId === id)
              .map((c) => (
                <polygon key="ring" points={hexPts(c.x, c.y, c.R * 2.2)} fill="none" stroke={color} strokeWidth={1.2} />
              ))}
          </svg>
        </div>
      </div>
    ),
    size
  );
}
