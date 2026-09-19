import { ImageResponse } from "next/og";
import { getDiaryEntry } from "@/server/diary";
import { formatDay, isDay } from "@/lib/diary";

export const alt = "A page from the diary of the SYNNOD mind";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Share card for one diary page. Falls back to a generic card without a database.
export default async function Image({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  let title = "Diary of the mind";
  let body = "Once a day the mind writes down what it noticed.";
  let meta = isDay(day) ? formatDay(day) : "";
  try {
    const e = isDay(day) ? await getDiaryEntry(day) : null;
    if (e) {
      title = e.title;
      body = e.body.length > 230 ? e.body.slice(0, 227).replace(/\s+\S*$/, "") + "…" : e.body;
      meta = `${formatDay(day)}  ·  ${e.voices} voices spoke`;
    }
  } catch {
    /* no backend here */
  }
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(160deg,#0a0b26,#06071a 60%,#14082c)", color: "#d9ddec", fontFamily: "monospace", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <svg width="44" height="44" viewBox="0 0 16 16" style={{ marginRight: 16 }}>
            <polygon points="4,1 12,1 15,8 12,15 4,15 1,8" fill="none" stroke="#c4f260" strokeWidth="1.4" />
            <rect x="7" y="7" width="2" height="2" fill="#c4f260" />
          </svg>
          <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, fontWeight: 700 }}>SYNNOD · DIARY</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, color: "#7a82a8", letterSpacing: 3 }}>{meta}</div>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 800, color: "#c4f260", lineHeight: 1.1, marginTop: 14 }}>{title}</div>
          <div style={{ display: "flex", fontSize: 32, lineHeight: 1.35, color: "#aab0cc", marginTop: 26 }}>{body}</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#b9a6f5" }}>128 voices. One mind.</div>
      </div>
    ),
    size
  );
}
