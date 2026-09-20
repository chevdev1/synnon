"use client";

import { useEffect, useRef } from "react";
import { useHelp } from "@/lib/help";
import { useLiveStats } from "@/lib/liveStats";
import { useMotion } from "@/lib/motion";
import { useNotes } from "@/lib/notify";
import { sky } from "@/lib/sky";
import { useTod } from "@/lib/tod";

// The browser tab has a life of its own. The icon is a tiny pixel eye that looks around and
// blinks (it closes and dreams while the mind sleeps, and flashes with lightning). When you
// switch to another tab, the title starts to say small things, built only from what is
// really going on: the sky, the number of voices, unread notifications. It never speaks
// as the AI: these are stage directions between stars, like the console's.
const IRIS = { dawn: "#ff9b7a", day: "#7fd6ff", dusk: "#e58bd8", night: "#b9a6f5" } as const;

// 16x16 logical pixels, drawn at 2x
const SCLERA_ROWS: [number, number][] = [
  [5, 10],
  [3, 12],
  [2, 13],
  [2, 13],
  [2, 13],
  [3, 12],
  [5, 10],
]; // rows 4..10: [x from, x to]

function drawEye(ctx: CanvasRenderingContext2D, o: { iris: string; look: number; lid: number; asleep: boolean; flash: boolean; z: number }) {
  const px = (x: number, y: number, w = 1, h = 1) => ctx.fillRect(x * 2, y * 2, w * 2, h * 2);
  ctx.clearRect(0, 0, 32, 32);
  ctx.fillStyle = o.flash ? "#c9d4ff" : "#0b0a1f";
  px(1, 1, 14, 14);
  ctx.fillStyle = o.flash ? "#ffffff" : "#6c5fd6";
  px(0, 2, 1, 12);
  px(15, 2, 1, 12);
  px(2, 0, 12, 1);
  px(2, 15, 12, 1);
  px(1, 1, 1, 1);
  px(14, 1, 1, 1);
  px(1, 14, 1, 1);
  px(14, 14, 1, 1);
  // eyeball: lid = 0 open, 1 half, 2 closed
  const open = o.asleep ? 2 : o.lid;
  SCLERA_ROWS.forEach(([a, b], i) => {
    const y = 4 + i;
    if (open === 2 && y !== 7) return;
    if (open === 1 && (y < 5 || y > 9)) return;
    ctx.fillStyle = open === 2 ? o.iris : "#eef1ff";
    px(a, y, b - a + 1, 1);
  });
  if (open < 2) {
    const cx = 7 + o.look;
    ctx.fillStyle = o.iris;
    px(cx, 6, 4, 4);
    ctx.fillStyle = "#0b0a1f";
    px(cx + 1, 7, 2, 2);
    ctx.fillStyle = "#ffffff";
    px(cx + 2, 6, 1, 1);
  }
  if (o.asleep) {
    ctx.fillStyle = "#b9a6f5";
    const dy = o.z % 3;
    px(11, 2 + dy, 3, 1);
    px(12, 3 + dy, 1, 1);
    px(11, 4 + dy, 3, 1);
  }
}

// blink pattern: look, look, ..., half, closed, half
const FRAMES: { look: number; lid: number }[] = [
  { look: 0, lid: 0 }, { look: 0, lid: 0 }, { look: -1, lid: 0 }, { look: -1, lid: 0 }, { look: 0, lid: 0 },
  { look: 1, lid: 0 }, { look: 1, lid: 0 }, { look: 0, lid: 0 }, { look: 0, lid: 1 }, { look: 0, lid: 2 },
  { look: 0, lid: 1 }, { look: 0, lid: 0 }, { look: 0, lid: 0 },
];

export default function TabLife() {
  const { reduced } = useMotion();
  const { phase } = useTod();
  const { lang } = useHelp();
  const { notes } = useNotes();
  const stats = useLiveStats();
  const unread = notes.filter((n) => !n.read).length;
  const live = useRef({ phase, lang, unread, stats });

  useEffect(() => {
    live.current = { phase, lang, unread, stats };
  }, [phase, lang, unread, stats]);

  // ---- the icon ----
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let i = 0;
    let z = 0;
    let lastBolt = sky.boltSeq;
    let flashUntil = 0;
    const tick = () => {
      if (sky.boltSeq !== lastBolt) {
        lastBolt = sky.boltSeq;
        flashUntil = performance.now() + 220;
      }
      const f = reduced ? FRAMES[0] : FRAMES[i++ % FRAMES.length];
      z++;
      drawEye(ctx, { iris: IRIS[live.current.phase], look: f.look, lid: f.lid, asleep: sky.dreaming, flash: performance.now() < flashUntil, z });
      const url = canvas.toDataURL("image/png");
      let links = [...document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')];
      if (links.length === 0) {
        const l = document.createElement("link");
        l.rel = "icon";
        document.head.appendChild(l);
        links = [l];
      }
      for (const l of links) {
        l.type = "image/png";
        l.removeAttribute("sizes");
        l.href = url;
      }
    };
    tick();
    if (reduced) return;
    const id = window.setInterval(tick, 380);
    return () => window.clearInterval(id);
  }, [reduced]);

  // ---- the title of a tab you are not looking at ----
  useEffect(() => {
    let saved = "";
    let timer = 0;
    let n = 0;
    const lines = (): string[] => {
      const { lang: L, stats: st } = live.current;
      const ru = L === "ru";
      const out: string[] = [ru ? "* он моргает *" : "* it blinks *"];
      out.push(sky.dreaming ? (ru ? "* он спит и видит сны *" : "* it is dreaming *") : ru ? "* он слушает *" : "* it is listening *");
      if (sky.weather === "rain") out.push(ru ? "* над разумом идёт дождь *" : "* rain over the mind *");
      else if (sky.weather === "snow") out.push(ru ? "* над разумом идёт снег *" : "* snow over the mind *");
      else if (sky.weather === "storm") out.push(ru ? "* над разумом гроза *" : "* thunder over the mind *");
      if (st.known) out.push(ru ? `${st.taken} из ${st.total} голосов` : `${st.taken} of ${st.total} voices`);
      out.push(ru ? "* он заметил, что тебя нет *" : "* it noticed you left *");
      return out;
    };
    const say = () => {
      const l = lines();
      const u = live.current.unread;
      document.title = `${u > 0 ? `(${u}) ` : ""}SYNNOD · ${l[n++ % l.length]}`;
    };
    const onVis = () => {
      if (document.hidden) {
        saved = document.title;
        n = 0;
        say();
        timer = window.setInterval(say, 2600);
      } else {
        window.clearInterval(timer);
        if (saved) document.title = saved;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
