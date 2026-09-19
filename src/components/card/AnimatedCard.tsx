"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { generateBrain, NH, NW, type Cell } from "@/lib/brain/generate";
import { drawCosmos } from "@/lib/cosmos";
import { useLive } from "@/lib/live/context";
import { achActions } from "@/lib/achStore";
import type { NodeProfile } from "@/lib/nodeProfile";

// A 1200x630 animated share card (8-second loop) drawn on a canvas: the living
// sky, the brain with this cell pulsing, sparks to the cells it shares thoughts
// with, counters that count up and a thought that types itself out. The same
// canvas can be recorded to a video file in the browser (MediaRecorder).
export const CARD_W = 1200;
export const CARD_H = 630;
export const LOOP_MS = 8000;
const S = 3; // logical 400x210, scaled x3
const LW = CARD_W / S;
const LH = CARD_H / S;

const STATUS_COLOR: Record<string, string> = { available: "#7a82a8", claimed: "#ffd166", active: "#c4f260", memory: "#b9a6f5", featured: "#ff9be0" };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

function hex(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + R * Math.cos(a);
    const y = cy + R * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

const quad = (ax: number, ay: number, cx: number, cy: number, bx: number, by: number, u: number): [number, number] => {
  const m = 1 - u;
  return [m * m * ax + 2 * m * u * cx + u * u * bx, m * m * ay + 2 * m * u * cy + u * u * by];
};

function pickMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const list = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return list.find((m) => MediaRecorder.isTypeSupported(m)) ?? null;
}

export default function AnimatedCard({ profile, thought, autoRecord = false }: { profile: NodeProfile; thought?: string | null; autoRecord?: boolean }) {
  const { nodes } = useLive();
  const ref = useRef<HTMLCanvasElement>(null);
  const model = useMemo(() => generateBrain(), []);
  const cells = useMemo(() => model.cells, [model]);
  const claimable = useMemo(() => cells.filter((c): c is Cell & { claimId: number } => c.claimId != null), [cells]);
  const [rec, setRec] = useState<"idle" | "recording" | "done" | "unsupported">("idle");
  const [fmt, setFmt] = useState<string>("");
  const origin = useRef(0);
  const state = useRef({ profile, thought, nodes, font: "monospace" });
  const quote = thought ?? profile.history.find((h) => h.kind === "thought")?.text ?? "128 voices. One mind.";

  useEffect(() => {
    state.current = { ...state.current, profile, thought: quote, nodes };
  }, [profile, quote, nodes]);

  useEffect(() => {
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-pixel-head").trim();
    if (fam) {
      state.current.font = fam;
      void document.fonts.load(`10px ${fam}`);
    }
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    origin.current = performance.now();

    const frame = (now: number) => {
      const { profile: p, thought: th, nodes: ns, font } = state.current;
      const t = (now - origin.current) % LOOP_MS;
      const id = p.node.id;
      const color = STATUS_COLOR[p.node.status] ?? "#c4f260";
      const status = new Map(ns.map((n) => [n.id, n.status]));

      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#06071a";
      ctx.fillRect(0, 0, LW, LH);
      const boost = Math.max(0, Math.sin((t / 1000) * 1.6) * 0.5);
      drawCosmos(ctx, LW, LH, t + 20000, { phase: "night", dreaming: false, animated: true, cx: Math.sin(t / 2600) * 0.5, cy: Math.cos(t / 3100) * 0.3, boost });

      // ---- brain (right) ----
      const bs = Math.min(190 / NW, 176 / NH);
      const ox = 200 + (190 - NW * bs) / 2;
      const oy = 16 + (178 - NH * bs) / 2;
      const P = (x: number, y: number): [number, number] => [ox + x * bs, oy + y * bs];
      const appear = ease(t / 900);
      ctx.globalAlpha = appear;
      for (const c of cells) {
        const [x, y] = P(c.x, c.y);
        const isMe = c.claimId === id;
        const isLink = c.claimId != null && p.links.includes(c.claimId);
        const st = c.claimId != null ? status.get(c.claimId) ?? "available" : null;
        const wave = 0.5 + 0.5 * Math.sin(t / 700 + c.x * 0.06 + c.y * 0.04);
        let fill = "#0d1236";
        if (c.claimId != null) fill = st && st !== "available" ? `rgb(${44 + wave * 30},${52 + wave * 30},${120 + wave * 40})` : "#151b47";
        if (isLink) fill = `rgb(${190 + wave * 30},${90},${200 + wave * 20})`;
        if (isMe) fill = color;
        hex(ctx, x, y, c.R * bs * 0.86);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = isMe ? color : isLink ? "#d674dc" : "#1d2358";
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const me = claimable.find((c) => c.claimId === id);
      if (me) {
        const [mx, my] = P(me.x, me.y);
        // pulsing rings around this cell
        for (let k = 0; k < 3; k++) {
          const u = ((t / 1400 + k / 3) % 1);
          ctx.strokeStyle = color;
          ctx.globalAlpha = (1 - u) * 0.8;
          ctx.lineWidth = 1;
          hex(ctx, mx, my, me.R * bs * (1 + u * 3.2));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // sparks to the linked cells, staggered, looping
        p.links.slice(0, 4).forEach((lid, k) => {
          const tc = claimable.find((c) => c.claimId === lid);
          if (!tc) return;
          const [tx, ty] = P(tc.x, tc.y);
          const cyc = ((t / 1000 + k * 0.55) % 2.6) / 1.2; // 0..~2.17
          const u = clamp01(cyc);
          const fade = cyc < 1 ? 1 : Math.max(0, 1 - (cyc - 1) / 1.0);
          if (fade <= 0) return;
          const d = Math.hypot(tx - mx, ty - my) || 1;
          const bend = (k % 2 ? -1 : 1) * d * 0.22;
          const cx = (mx + tx) / 2 + (-(ty - my) / d) * bend;
          const cy = (my + ty) / 2 + ((tx - mx) / d) * bend;
          ctx.globalCompositeOperation = "lighter";
          for (let i = 0; i <= 24 * u; i++) {
            const [x, y] = quad(mx, my, cx, cy, tx, ty, i / 24);
            ctx.fillStyle = `rgba(214,116,220,${(fade * (0.3 + 0.6 * (i / 24 / (u || 1)))).toFixed(3)})`;
            ctx.fillRect(Math.round(x) - 0.5, Math.round(y) - 0.5, 1.4, 1.4);
          }
          if (cyc < 1) {
            const [x, y] = quad(mx, my, cx, cy, tx, ty, u);
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
          } else {
            ctx.strokeStyle = `rgba(214,116,220,${(1 - (cyc - 1)).toFixed(3)})`;
            ctx.lineWidth = 0.8;
            hex(ctx, tx, ty, tc.R * bs * (1 + (cyc - 1) * 2));
            ctx.stroke();
          }
          ctx.globalCompositeOperation = "source-over";
        });
      }

      // ---- text (left) ----
      const fadeIn = ease(t / 500);
      const fadeOut = 1 - clamp01((t - (LOOP_MS - 400)) / 400);
      ctx.globalAlpha = fadeIn * fadeOut;
      ctx.textBaseline = "top";
      // logo + wordmark
      hex(ctx, 20, 20, 7);
      ctx.strokeStyle = "#c4f260";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#c4f260";
      ctx.fillRect(19, 19, 2, 2);
      ctx.fillStyle = "#d9ddec";
      ctx.font = `8px ${font}`;
      ctx.fillText("SYNNOD", 33, 16);

      ctx.fillStyle = "#7a82a8";
      ctx.font = `7px ${font}`;
      ctx.fillText("// NODE", 16, 46);
      // big number with an occasional glitch offset
      const glitch = t % 3000 < 90 ? 2 : 0;
      ctx.font = `40px ${font}`;
      ctx.fillStyle = "rgba(255,155,224,0.7)";
      if (glitch) ctx.fillText(String(id).padStart(2, "0"), 16 - glitch, 58);
      ctx.fillStyle = color;
      ctx.fillText(String(id).padStart(2, "0"), 16 + glitch, 58);

      // owner types out
      const owner = p.node.ownerName ?? (p.node.status === "available" ? "still free" : "a voice of the mind");
      const oN = Math.floor(clamp01((t - 500) / 900) * owner.length);
      ctx.fillStyle = "#aab0cc";
      ctx.font = `8px ${font}`;
      ctx.fillText(owner.slice(0, oN) + (oN < owner.length && t % 300 < 150 ? "_" : ""), 16, 108);

      // counters count up
      const k = ease((t - 1100) / 1200);
      const stats: [string, string][] = [
        [String(Math.round(p.stats.voices * k)), "VOICES"],
        [String(Math.round(p.stats.thoughtsShaped * k)), "THOUGHTS"],
        [`${(p.stats.sharePct * k).toFixed(p.stats.sharePct % 1 === 0 ? 0 : 1)}%`, "OF MIND"],
      ];
      stats.forEach(([v, l], i) => {
        const x = 16 + i * 62;
        ctx.fillStyle = "#c4f260";
        ctx.font = `13px ${font}`;
        ctx.fillText(v, x, 128);
        ctx.fillStyle = "#7a82a8";
        ctx.font = `5px ${font}`;
        ctx.fillText(l, x, 146);
      });

      // thought types itself out (wrapped)
      const line = th ?? "";
      const tN = Math.floor(clamp01((t - 2400) / 3200) * line.length);
      ctx.fillStyle = "#c4f260";
      ctx.font = `6px ${font}`;
      const words = line.slice(0, tN).split(" ");
      let row = "";
      let yy = 162;
      for (const w of words) {
        const test = row ? `${row} ${w}` : w;
        if (ctx.measureText(test).width > 172 && row) {
          ctx.fillText(row, 16, yy);
          yy += 9;
          row = w;
        } else row = test;
      }
      ctx.fillText(row + (tN < line.length && t % 300 < 150 ? "_" : ""), 16, yy);
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [cells, claimable]);

  function record() {
    const canvas = ref.current;
    const mime = pickMime();
    if (!canvas || !mime) {
      setRec("unsupported");
      return;
    }
    const isMp4 = mime.startsWith("video/mp4");
    const chunks: Blob[] = [];
    const r = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      const blob = new Blob(chunks, { type: mime.split(";")[0] });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `synnod-node-${String(profile.node.id).padStart(2, "0")}.${isMp4 ? "mp4" : "webm"}`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setRec("done");
      achActions.unlock("broadcaster");
    };
    setFmt(isMp4 ? "MP4" : "WebM");
    setRec("recording");
    origin.current = performance.now(); // the video starts at the start of the loop
    r.start();
    window.setTimeout(() => r.stop(), LOOP_MS + 150);
  }

  useEffect(() => {
    if (!autoRecord) return;
    const id = window.setTimeout(record, 1200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRecord]);

  return (
    <div data-animated-card>
      <canvas ref={ref} width={CARD_W} height={CARD_H} className="block h-auto w-full border-2 border-[var(--border)]" style={{ imageRendering: "pixelated", aspectRatio: `${CARD_W} / ${CARD_H}` }} aria-label={`Animated card for node ${profile.node.id}`} role="img" />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => (origin.current = performance.now())} className="pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)]">
          ↺ Replay
        </button>
        <button type="button" disabled={rec === "recording"} onClick={record} className="pixel-btn font-head flex h-9 items-center border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-3 text-[8px] uppercase text-[var(--text)] disabled:opacity-60" data-record-btn>
          {rec === "recording" ? `Recording ${fmt}…` : "⬇ Download video"}
        </button>
        <a href={`/node/${profile.node.id}/opengraph-image`} download={`synnod-node-${profile.node.id}.png`} className="pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)]">
          ⬇ Still image
        </a>
      </div>
      <p className="mt-2 text-[16px] leading-snug text-[var(--muted)]" data-record-note>
        {rec === "unsupported"
          ? "This browser can't record video. Try Chrome, Edge or Safari."
          : rec === "done"
            ? `Saved a ${fmt} file. Upload it straight to X: links can't play video by themselves, an uploaded file can.`
            : "8-second loop, 1200×630. Upload the file to X as a video; a plain link only shows the still image."}
      </p>
    </div>
  );
}
