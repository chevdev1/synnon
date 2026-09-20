"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHelp } from "@/lib/help";
import { sky } from "@/lib/sky";
import { useTod } from "@/lib/tod";
import { seasonOf, type Season } from "@/lib/weather";

// A pixel clock in the header. Click for a small calendar: the date, the season, the
// phase of the moon, the sky right now and the days when a new goal and question begin.
const COLOR = { dawn: "#ff9b7a", day: "#7fd6ff", dusk: "#e58bd8", night: "#b9a6f5" } as const;
const SEASON_COLOR: Record<Season, string> = { winter: "#bfe6ff", spring: "#ffc2e0", summer: "#d8ff7a", autumn: "#e0862e" };
const SEASON_NAME: Record<Season, { en: string; ru: string }> = {
  winter: { en: "Winter", ru: "Зима" },
  spring: { en: "Spring", ru: "Весна" },
  summer: { en: "Summer", ru: "Лето" },
  autumn: { en: "Autumn", ru: "Осень" },
};
const SKY_NAME = { clear: { en: "clear", ru: "ясно" }, rain: { en: "rain", ru: "дождь" }, snow: { en: "snow", ru: "снег" }, storm: { en: "thunderstorm", ru: "гроза" } } as const;

// 3x5 pixel digits
const GLYPH: Record<string, string[]> = {
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  ":": ["0", "1", "0", "1", "0"],
};

function PixelText({ text, px, color, blink }: { text: string; px: number; color: string; blink?: boolean }) {
  let x = 0;
  const rects: React.ReactNode[] = [];
  [...text].forEach((ch, i) => {
    const g = GLYPH[ch];
    if (!g) return;
    g.forEach((row, y) => [...row].forEach((c, k) => c === "1" && rects.push(<rect key={`${i}-${y}-${k}`} x={x + k} y={y} width={1} height={1} className={blink && ch === ":" ? "clock-blink" : undefined} />)));
    x += g[0].length + 1;
  });
  return (
    <svg width={(x - 1) * px} height={5 * px} viewBox={`0 0 ${x - 1} 5`} shapeRendering="crispEdges" fill={color} aria-hidden>
      {rects}
    </svg>
  );
}

// phase 0..1 (0 new, .5 full)
const moonPhase = (d: Date) => (((d.getTime() / 86400000 + 2440587.5 - 2451550.1) / 29.530588853) % 1 + 1) % 1;
const MOON_NAMES = [
  { en: "New moon", ru: "Новолуние" },
  { en: "Waxing crescent", ru: "Растущий серп" },
  { en: "First quarter", ru: "Первая четверть" },
  { en: "Waxing gibbous", ru: "Растущая луна" },
  { en: "Full moon", ru: "Полнолуние" },
  { en: "Waning gibbous", ru: "Убывающая луна" },
  { en: "Last quarter", ru: "Последняя четверть" },
  { en: "Waning crescent", ru: "Убывающий серп" },
];

function Moon({ phase, size = 44 }: { phase: number; size?: number }) {
  const N = 11;
  const k = Math.cos(phase * Math.PI * 2);
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    const yy = (y - 5) / 5;
    const w = Math.sqrt(Math.max(0, 1 - yy * yy));
    for (let x = 0; x < N; x++) {
      const xx = (x - 5) / 5;
      if (Math.abs(xx) > w + 0.05) continue;
      const lit = phase < 0.5 ? xx >= k * w : xx <= -k * w;
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={lit ? "#f4efc8" : "#2a2d5a"} />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" aria-hidden>
      {cells}
    </svg>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function ClockChip() {
  const { phase } = useTod();
  const { lang } = useHelp();
  const [now, setNow] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [pos, setPos] = useState({ left: 12, top: 60 });
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const c = COLOR[phase];

  useEffect(() => {
    const first = window.setTimeout(() => setNow(new Date()), 0);
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  function toggle() {
    if (!open && btn.current && now) {
      const r = btn.current.getBoundingClientRect();
      const w = Math.min(340, window.innerWidth - 24);
      setPos({ left: Math.max(12, Math.min(r.left, window.innerWidth - w - 12)), top: r.bottom + 8 });
      setView({ y: now.getFullYear(), m: now.getMonth() });
    }
    setOpen((o) => !o);
  }

  const hm = now ? `${pad(now.getHours())}:${pad(now.getMinutes())}` : "--:--";
  const seasonNow = now ? seasonOf(now) : "autumn";

  let cal: React.ReactNode = null;
  if (open && now && view) {
    const first = new Date(view.y, view.m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const loc = lang === "ru" ? "ru-RU" : "en-GB";
    const monthName = new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(first);
    const wd = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(loc, { weekday: "short" }).format(new Date(2024, 0, 1 + i)));
    const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
    const isToday = (d: number) => d === now.getDate() && view.m === now.getMonth() && view.y === now.getFullYear();
    const mp = moonPhase(now);
    const moon = MOON_NAMES[Math.round(mp * 8) % 8];
    const sc = SEASON_COLOR[seasonNow];
    cal = (
      <div
        ref={panel}
        role="dialog"
        aria-label={T("Clock and calendar", "Часы и календарь")}
        data-clock-panel
        className="fixed z-[70] border-2 bg-[#080a20] p-3 shadow-[5px_5px_0_rgba(0,0,0,0.5)]"
        style={{ left: pos.left, top: pos.top, width: Math.min(340, typeof window === "undefined" ? 340 : window.innerWidth - 24), borderColor: c }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <PixelText text={hm} px={6} color={c} blink />
            <div className="font-head mt-2 text-[7px] uppercase" style={{ color: c }}>
              :{pad(now.getSeconds())} · {phase}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <Moon phase={mp} />
            <span className="font-head text-[6px] uppercase text-[var(--muted)]">{moon[lang]}</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t-2 border-[var(--divider)] pt-2 text-[16px] text-[var(--text-2)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2" style={{ background: sc, boxShadow: `0 0 6px ${sc}` }} />
            {SEASON_NAME[seasonNow][lang]}
          </span>
          <span>
            {T("Sky", "Небо")}: {SKY_NAME[sky.weather][lang]}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <button type="button" aria-label="Previous month" onClick={() => setView({ y: view.m === 0 ? view.y - 1 : view.y, m: (view.m + 11) % 12 })} className="pixel-btn font-head h-7 w-7 border-2 border-[var(--border)] text-[9px] text-[var(--text-2)] hover:border-[var(--lime)]">
            ‹
          </button>
          <span className="font-head text-[8px] uppercase text-[var(--text)]">{monthName}</span>
          <button type="button" aria-label="Next month" onClick={() => setView({ y: view.m === 11 ? view.y + 1 : view.y, m: (view.m + 1) % 12 })} className="pixel-btn font-head h-7 w-7 border-2 border-[var(--border)] text-[9px] text-[var(--text-2)] hover:border-[var(--lime)]">
            ›
          </button>
        </div>
        <div className="mt-2 grid grid-cols-7 gap-[3px] text-center" data-clock-grid>
          {wd.map((d, i) => (
            <span key={d} className="font-head text-[6px] uppercase" style={{ color: i >= 5 ? "#e58bd8" : "var(--muted)" }}>
              {d.slice(0, 2)}
            </span>
          ))}
          {cells.map((d, i) =>
            d == null ? (
              <span key={`e${i}`} />
            ) : (
              <span
                key={d}
                data-today={isToday(d) ? "1" : undefined}
                className={`relative flex h-8 items-center justify-center border-2 text-[17px] leading-none ${isToday(d) ? "clock-today text-[#06071a]" : "border-[var(--border)] text-[var(--text-2)]"}`}
                style={isToday(d) ? { background: c, borderColor: c } : undefined}
              >
                {d}
                {i % 7 === 0 && !isToday(d) && <span className="absolute right-[2px] top-[2px] h-[3px] w-[3px]" style={{ background: "#ffd166" }} />}
              </span>
            ),
          )}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[14px] text-[var(--muted)]">
          <span className="h-[3px] w-[3px]" style={{ background: "#ffd166" }} />
          {T("Monday: a new community goal and a new question", "Понедельник: новая цель сообщества и новый вопрос")}
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        data-help-id="clock"
        data-clock-btn
        aria-expanded={open}
        aria-label={T("Clock and calendar", "Часы и календарь")}
        className="pixel-btn flex h-11 items-center gap-2 border-2 px-3 sm:h-9"
        style={{ borderColor: c }}
      >
        <PixelText text={hm} px={2} color={c} blink />
      </button>
      {cal && createPortal(cal, document.body)}
    </>
  );
}
