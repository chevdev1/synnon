"use client";

import { useEffect, useState } from "react";
import { ACH_BY_ID } from "@/lib/achievements";
import { achActions, useAch } from "@/lib/achStore";
import { questActions } from "@/lib/questStore";
import { useHelp } from "@/lib/help";
import { PETS, petPalette, usePet, type Pet } from "@/lib/pets";
import { sfx } from "@/lib/sfx";

function Sprite({ pet, size = 28, locked = false }: { pet: Pet; size?: number; locked?: boolean }) {
  const pal = locked ? { "#": "#3a4180", o: "#262c5e", x: "#1a1f47" } : petPalette(pet.color);
  return (
    <svg width={size} height={size} viewBox="0 0 7 7" shapeRendering="crispEdges" aria-hidden>
      {pet.rows.flatMap((row, y) => [...row].map((ch, x) => (ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={pal[ch]} />)))}
    </svg>
  );
}

// "Pet" button on the brain stage: pick the companion that follows your cell.
export default function PetPicker({ hasCell }: { hasCell: boolean }) {
  const { id, choose } = usePet();
  const { unlocked } = useAch();
  const { lang } = useHelp();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  // Where the panel floats. It is fixed to the screen (not the brain stage, which clips it)
  // and always placed so the whole panel fits, whatever the window size.
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 8, top: 8 });
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);

  function toggle(btn: HTMLElement) {
    if (open) return setOpen(false);
    const r = btn.getBoundingClientRect();
    const w = Math.min(280, window.innerWidth - 16);
    const h = 430; // generous: the panel scrolls inside if the screen is shorter
    const narrow = window.innerWidth < 640;
    const left = narrow ? (window.innerWidth - w) / 2 : Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
    const top = narrow ? Math.max(8, window.innerHeight - h - 12) : Math.max(8, Math.min(r.bottom + 6, window.innerHeight - h - 8));
    setPos({ left, top });
    setFocus(null);
    setOpen(true);
  }
  const cur = PETS.find((p) => p.id === id && (!p.needs || unlocked[p.needs]));
  const shown = PETS.find((p) => p.id === focus) ?? cur ?? PETS[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="absolute left-4 top-[88px]" data-help-id="pet">
      <button
        type="button"
        onClick={(e) => toggle(e.currentTarget)}
        aria-expanded={open}
        data-pet-btn
        className="pixel-btn font-head flex h-7 items-center gap-1.5 border-2 border-[var(--accent)] bg-[#080a20]/85 px-2 text-[7px] uppercase text-[var(--link)]"
      >
        {cur ? <Sprite pet={cur} size={14} /> : <span className="text-[9px]">+</span>}
        {cur ? cur.name[lang] : T("Pet", "Питомец")}
      </button>
      {open && (
        <div
          style={{ left: pos.left, top: pos.top, width: "min(280px, calc(100vw - 16px))", maxHeight: "calc(100dvh - 16px)" }}
          onMouseLeave={() => setFocus(null)}
          className="fade-in-up fixed z-[65] overflow-y-auto border-2 border-[var(--accent)] bg-[#080a20] p-2.5 shadow-[4px_4px_0_rgba(108,95,214,0.4)]"
          role="dialog" aria-label={T("Choose a companion", "Выбери спутника")} data-pet-panel>
          <div className="font-head text-[7px] uppercase text-[var(--muted)]">{T("Companion", "Спутник")}</div>
          {!hasCell && <p className="mt-1 text-[15px] leading-snug text-[#ffd166]">{T("It appears next to your cell. Claim one first.", "Он появится возле твоей клетки. Сначала займи её.")}</p>}
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {PETS.map((p) => {
              const locked = !!p.needs && !unlocked[p.needs];
              const on = cur?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  data-pet-id={p.id}
                  data-pet-state={locked ? "locked" : on ? "selected" : "free"}
                  title={locked ? `${T("Locked", "Закрыт")}: ${p.hint?.[lang] ?? ""} (${ACH_BY_ID.get(p.needs!)?.name[lang] ?? ""})` : p.name[lang]}
                  onMouseEnter={() => setFocus(p.id)}
                  onFocus={() => setFocus(p.id)}
                  onClick={() => {
                    if (locked) {
                      setFocus(p.id); // a tap on a locked pet shows how to get it
                      return;
                    }
                    choose(p.id);
                    sfx.found();
                    achActions.unlock("adopted");
                    questActions.event("pet");
                    setOpen(false);
                  }}
                  aria-disabled={locked}
                  className={`flex flex-col items-center gap-1 border-2 p-1.5 ${locked ? "cursor-not-allowed" : ""}`}
                  style={{ borderColor: on ? p.color : "var(--border)", background: on ? `${p.color}22` : "#0b0a1f" }}
                >
                  <Sprite pet={p} size={30} locked={locked} />
                  <span className="font-head text-[6px] uppercase leading-tight" style={{ color: locked ? "var(--faint)" : p.color }}>
                    {locked ? "× " : ""}
                    {p.name[lang]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 border-2 border-[var(--border)] bg-[#0b0a1f] p-2" data-pet-perk>
            <div className="font-head text-[7px] uppercase" style={{ color: shown.color }}>
              {T("Perk", "Перк")}: {shown.perk.name[lang]}
            </div>
            <p className="mt-1 text-[15px] leading-snug text-[var(--text-2)]">{shown.perk.desc[lang]}</p>
            {shown.needs && !unlocked[shown.needs] && (
              <p className="mt-1 text-[14px] leading-snug text-[#ffd166]">
                {T("Locked", "Закрыт")}: {shown.hint?.[lang]} ({ACH_BY_ID.get(shown.needs)?.name[lang]})
              </p>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[14px] leading-snug text-[var(--muted)]">{T("Locked ones are earned through achievements.", "Закрытых можно добиться достижениями.")}</p>
            {cur && (
              <button type="button" onClick={() => (choose(null), setOpen(false))} className="font-head shrink-0 text-[6px] uppercase text-[var(--muted)] hover:text-[#ff8a6c]" data-pet-none>
                {T("none", "убрать")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
