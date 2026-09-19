"use client";

import { useEffect, useState } from "react";
import { ACH_BY_ID } from "@/lib/achievements";
import { achActions, useAch } from "@/lib/achStore";
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
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const cur = PETS.find((p) => p.id === id && (!p.needs || unlocked[p.needs]));

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
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-pet-btn
        className="pixel-btn font-head flex h-7 items-center gap-1.5 border-2 border-[var(--accent)] bg-[#080a20]/85 px-2 text-[7px] uppercase text-[var(--link)]"
      >
        {cur ? <Sprite pet={cur} size={14} /> : <span className="text-[9px]">+</span>}
        {cur ? cur.name[lang] : T("Pet", "Питомец")}
      </button>
      {open && (
        <div className="fade-in-up fixed inset-x-3 bottom-20 z-[65] mx-auto max-w-[320px] border-2 border-[var(--accent)] bg-[#080a20] p-2.5 shadow-[4px_4px_0_rgba(108,95,214,0.4)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:z-10 sm:mx-0 sm:mt-1.5 sm:w-[248px]" role="dialog" aria-label={T("Choose a companion", "Выбери спутника")} data-pet-panel>
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
                  disabled={locked}
                  onClick={() => {
                    choose(p.id);
                    sfx.found();
                    achActions.unlock("adopted");
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 border-2 p-1.5 disabled:cursor-not-allowed"
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
