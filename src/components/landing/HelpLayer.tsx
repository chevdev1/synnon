"use client";

import { useEffect, useState } from "react";
import { GLOSSARY, HELP, TOUR, UI, helpActions, useHelp } from "@/lib/help";

interface R {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const same = (a: Record<string, R>, b: Record<string, R>) => {
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => b[k] && a[k].left === b[k].left && a[k].top === b[k].top && a[k].right === b[k].right && a[k].bottom === b[k].bottom);
};

const POP_W = 340;

export default function HelpLayer() {
  const h = useHelp();
  const [rects, setRects] = useState<Record<string, R>>({});
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  const [popH, setPopH] = useState(230);

  // Track where every helpable block currently is (layout changes with the
  // window, the breathing animation, list growth...).
  useEffect(() => {
    if (!h.on) return;
    let raf = 0;
    const loop = () => {
      const next: Record<string, R> = {};
      document.querySelectorAll<HTMLElement>("[data-help-id]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 6 || r.height < 6) return;
        next[el.dataset.helpId as string] = { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom) };
      });
      setRects((prev) => (same(prev, next) ? prev : next));
      setVp((prev) => (prev.w === window.innerWidth && prev.h === window.innerHeight ? prev : { w: window.innerWidth, h: window.innerHeight }));
      const pop = document.querySelector<HTMLElement>("[data-help-pop]");
      if (pop) setPopH((prev) => (prev === pop.offsetHeight ? prev : pop.offsetHeight));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [h.on]);

  // Highlight the block being explained.
  useEffect(() => {
    if (!h.on || !h.active) return;
    const el = document.querySelector<HTMLElement>(`[data-help-id="${h.active}"]`);
    if (!el) return;
    el.setAttribute("data-help-active", "1");
    // Phones: bring the block to the top so the tip (a bottom sheet) sits below it.
    el.scrollIntoView({ block: window.innerWidth < 640 ? "start" : "nearest", behavior: "smooth" });
    return () => el.removeAttribute("data-help-active");
  }, [h.on, h.active]);

  useEffect(() => {
    if (!h.on) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") helpActions.close();
      else if (e.key === "ArrowRight") helpActions.tour(1);
      else if (e.key === "ArrowLeft") helpActions.tour(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [h.on]);

  if (!h.on) return null;

  const L = h.lang;
  const entry = h.active ? HELP[h.active] : null;
  const ar = h.active ? rects[h.active] : undefined;
  const idx = h.active ? TOUR.indexOf(h.active) : -1;

  let pop: React.CSSProperties | null = null;
  if (entry) {
    const w = Math.min(POP_W, vp.w - 16);
    // Keep clear of the help bar, which wraps to two lines on narrow screens.
    const reserve = vp.w < 640 ? 104 : 64;
    const maxTop = Math.max(8, vp.h - popH - reserve);
    const clampTop = (t: number) => Math.min(Math.max(8, t), maxTop);
    const clampLeft = (l: number) => Math.min(Math.max(8, l), vp.w - w - 8);
    if (!ar || vp.w < 640) pop = { left: clampLeft((vp.w - w) / 2), top: maxTop, width: w }; // phones: bottom sheet
    else {
      // Put the tip NEXT to the lit block (over the blurred rest of the page),
      // never on top of it, so the block being explained stays fully visible.
      const gap = 18;
      const fits = (c: { left: number; top: number }) => c.left >= 8 && c.left + w <= vp.w - 8 && c.top >= 8 && c.top + popH <= vp.h - reserve;
      const right = { left: ar.right + gap, top: clampTop(ar.top) };
      const left = { left: ar.left - w - gap, top: clampTop(ar.top) };
      const below = { left: clampLeft(ar.left), top: ar.bottom + gap };
      const above = { left: clampLeft(ar.left), top: ar.top - popH - gap };
      const order = ar.top < 80 ? [below, right, left, above] : ar.top > vp.h * 0.55 ? [above, right, left, below] : [right, left, below, above];
      const spot = order.find(fits);
      pop = spot
        ? { left: spot.left, top: spot.top, width: w }
        : { left: clampLeft(ar.left + 16), top: clampTop(ar.top + 56), width: w }; // no free side (small screens): overlap, stay on screen
    }
  }

  // Spotlight: dim + blur everything except the block being explained.
  const PAD = 6;
  const hole = ar && h.active ? { x1: Math.max(0, ar.left - PAD), y1: Math.max(0, ar.top - PAD), x2: Math.min(vp.w, ar.right + PAD), y2: Math.min(vp.h, ar.bottom + PAD) } : null;
  const dimCls = "help-dim fixed z-[64] cursor-pointer bg-[#04051a]/60 backdrop-blur-[3px]";

  return (
    <>
      {hole && (
        <>
          <div aria-hidden className={dimCls} onClick={() => helpActions.setActive(null)} style={{ left: 0, top: 0, width: vp.w, height: hole.y1 }} />
          <div aria-hidden className={dimCls} onClick={() => helpActions.setActive(null)} style={{ left: 0, top: hole.y2, width: vp.w, height: Math.max(0, vp.h - hole.y2) }} />
          <div aria-hidden className={dimCls} onClick={() => helpActions.setActive(null)} style={{ left: 0, top: hole.y1, width: hole.x1, height: Math.max(0, hole.y2 - hole.y1) }} />
          <div aria-hidden className={dimCls} onClick={() => helpActions.setActive(null)} style={{ left: hole.x2, top: hole.y1, width: Math.max(0, vp.w - hole.x2), height: Math.max(0, hole.y2 - hole.y1) }} />
        </>
      )}

      {Object.entries(rects).map(([id, r]) => {
        if (!HELP[id]) return null;
        const small = r.bottom - r.top < 48;
        const style = small ? { left: r.right - 12, top: r.top - 10 } : { left: r.right - 26, top: r.top + 6 };
        const active = h.active === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={`${UI.helpMode[L]}: ${HELP[id].title[L]}`}
            onClick={() => helpActions.setActive(active ? null : id)}
            className={`help-badge font-head fixed z-[65] flex h-5 w-5 items-center justify-center border-2 text-[9px] ${
              active ? "border-[#06071a] bg-[var(--lime)] text-[#06071a]" : "border-[var(--lime)] bg-[#06071a] text-[var(--lime)]"
            }`}
            style={{ ...style, opacity: h.active && !active ? 0.4 : 1 }}
          >
            ?
          </button>
        );
      })}

      {entry && pop && (
        <div
          role="dialog"
          data-help-pop
          aria-label={entry.title[L]}
          className="fade-in-up fixed z-[66] border-2 border-[var(--lime)] bg-[var(--panel)] p-3 shadow-[5px_5px_0_rgba(196,242,96,0.25)]"
          style={pop}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="font-head text-[9px] uppercase leading-relaxed text-[var(--lime)]">{entry.title[L]}</div>
            {idx >= 0 && <div className="font-head shrink-0 text-[8px] text-[var(--muted)]">{idx + 1}/{TOUR.length}</div>}
          </div>
          <p className="mt-2 text-[17px] leading-snug text-[var(--text)]">{entry.body[L]}</p>
          <div className="mt-3 flex items-center gap-2">
            <button type="button" onClick={() => helpActions.tour(-1)} className="pixel-btn font-head h-7 border-2 border-[var(--accent)] px-2 text-[8px] uppercase text-[var(--link)]">
              ← {UI.prev[L]}
            </button>
            <button type="button" onClick={() => helpActions.tour(1)} className="pixel-btn font-head h-7 border-2 border-[var(--lime)] px-2 text-[8px] uppercase text-[var(--lime)]">
              {UI.next[L]} →
            </button>
          </div>
        </div>
      )}

      {h.glossary && (
        <div className="fade-in-up fixed bottom-16 left-1/2 z-[66] max-h-[60vh] w-[min(94vw,520px)] -translate-x-1/2 overflow-y-auto border-2 border-[var(--cell-pink)] bg-[var(--panel)] p-3 shadow-[5px_5px_0_rgba(214,116,220,0.25)]">
          <div className="font-head mb-2 text-[9px] uppercase text-[var(--cell-pink)]">{UI.glossary[L]}</div>
          <dl className="space-y-2">
            {GLOSSARY.map((g) => (
              <div key={g.term.en}>
                <dt className="font-head text-[8px] uppercase text-[var(--text)]">{g.term[L]}</dt>
                <dd className="text-[16px] leading-snug text-[var(--text-2)]">{g.def[L]}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-3 z-[67] mx-auto flex w-fit max-w-[96vw] flex-wrap items-center justify-center gap-2 border-2 border-[var(--lime)] bg-[#06071a]/95 px-3 py-2 shadow-[4px_4px_0_rgba(196,242,96,0.25)]">
        <span className="font-head text-[8px] uppercase text-[var(--lime)]">{UI.helpMode[L]}</span>
        <span className="hidden text-[16px] text-[var(--text-2)] sm:inline">{UI.hint[L]}</span>
        <button type="button" onClick={() => helpActions.tour(1)} className="pixel-btn font-head h-7 border-2 border-[var(--lime)] px-2 text-[8px] uppercase text-[var(--lime)]">
          {UI.tour[L]} ▶
        </button>
        <button
          type="button"
          onClick={helpActions.toggleGlossary}
          aria-pressed={h.glossary}
          className={`pixel-btn font-head h-7 border-2 px-2 text-[8px] uppercase ${h.glossary ? "border-[var(--cell-pink)] bg-[var(--cell-pink)] text-[#06071a]" : "border-[var(--cell-pink)] text-[var(--cell-pink)]"}`}
        >
          {UI.glossary[L]}
        </button>
        <span className="font-head flex text-[8px] uppercase">
          {(["ru", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => helpActions.setLang(l)}
              aria-pressed={L === l}
              className={`h-7 border-2 px-2 ${L === l ? "border-[var(--link)] bg-[var(--link)] text-[#06071a]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}
            >
              {l}
            </button>
          ))}
        </span>
        <button type="button" onClick={helpActions.close} aria-label={UI.close[L]} className="font-head h-7 border-2 border-[var(--border)] px-2 text-[9px] text-[var(--muted)] hover:text-[#ff8a6c]">
          ✕
        </button>
      </div>
    </>
  );
}
