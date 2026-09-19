"use client";

import { useEffect, useState } from "react";
import { ACHIEVEMENTS, TIER_COLOR, TIER_LABEL, type Tier } from "@/lib/achievements";
import { achActions, useAch } from "@/lib/achStore";
import { useDemo } from "@/lib/demo";
import { useHelp } from "@/lib/help";
import AchIcon from "./AchIcon";

const EVENT = "synnod:open-ach";
export const openAchievements = () => window.dispatchEvent(new Event(EVENT));

const TIERS: Tier[] = ["bronze", "silver", "gold", "legend"];

// Header button: trophy + how many of the total are unlocked.
export function AchButton() {
  const { unlocked } = useAch();
  const n = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  return (
    <button
      type="button"
      onClick={openAchievements}
      data-help-id="achievements"
      aria-label={`Achievements: ${n} of ${ACHIEVEMENTS.length}`}
      className="pixel-btn font-head flex h-11 items-center gap-2 border-2 border-[#ffd166] px-3 text-[8px] uppercase text-[#ffd166] sm:h-9"
    >
      <AchIcon icon="trophy" color="#ffd166" size={16} />
      {n}/{ACHIEVEMENTS.length}
    </button>
  );
}

// The list: every achievement with its rarity colour, progress bar for the progressive ones,
// "???" for hidden ones. In the demo it also has a preview button so the pop-ups can be seen.
export default function AchievementsPanel() {
  const [open, setOpen] = useState(false);
  const { unlocked, prog } = useAch();
  const { lang } = useHelp();
  const { on: demo } = useDemo();

  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  const total = ACHIEVEMENTS.length;
  const done = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);

  function previewNext() {
    const locked = ACHIEVEMENTS.filter((a) => !unlocked[a.id]);
    const pool = locked.length ? locked : ACHIEVEMENTS;
    achActions.preview(pool[Math.floor(Math.random() * pool.length)].id);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)} role="dialog" aria-modal="true" aria-label={T("Achievements", "Достижения")} data-ach-panel>
      <div className="fade-in-up my-auto flex max-h-[92dvh] w-full max-w-3xl flex-col border-2 border-[#ffd166] bg-[var(--panel)] shadow-[6px_6px_0_rgba(255,209,102,0.3)]">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-[var(--divider)] p-4">
          <div>
            <h2 className="font-head flex items-center gap-2 text-[12px] uppercase text-[#ffd166]">
              <AchIcon icon="trophy" color="#ffd166" size={22} />
              {T("Achievements", "Достижения")}
            </h2>
            <p className="mt-2 text-[18px] text-[var(--text-2)]">
              {T(`${done} of ${total} unlocked`, `Получено ${done} из ${total}`)}
              <span className="ml-3 inline-flex gap-2 align-middle">
                {TIERS.map((t) => (
                  <span key={t} className="font-head text-[7px] uppercase" style={{ color: TIER_COLOR[t] }}>
                    {ACHIEVEMENTS.filter((a) => a.tier === t && unlocked[a.id]).length}/{ACHIEVEMENTS.filter((a) => a.tier === t).length} {TIER_LABEL[t][lang]}
                  </span>
                ))}
              </span>
            </p>
            <div className="mt-2 h-2 w-64 max-w-full bg-[var(--border)]">
              <div className="h-full bg-[#ffd166]" style={{ width: `${(done / total) * 100}%` }} />
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label={T("Close", "Закрыть")} className="font-head h-9 w-9 shrink-0 text-[11px] text-[var(--muted)] hover:text-[#ff8a6c]">
            ✕
          </button>
        </div>

        <ul className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-y-auto p-4 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const got = !!unlocked[a.id];
            const cur = Math.min(prog[a.id] ?? 0, a.max ?? 1);
            const secret = a.hidden && !got;
            const color = TIER_COLOR[a.tier];
            return (
              <li
                key={a.id}
                data-ach-id={a.id}
                data-ach-state={got ? "unlocked" : "locked"}
                onClick={demo ? () => achActions.preview(a.id) : undefined}
                title={demo ? T("Click to preview this pop-up", "Нажми, чтобы увидеть это окно") : undefined}
                className={`flex items-center gap-3 border-2 p-2.5 ${demo ? "cursor-pointer hover:brightness-125" : ""}`}
                style={{ borderColor: got ? color : "var(--border)", background: got ? `${color}12` : "transparent", opacity: got ? 1 : 0.85 }}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border-2 bg-[#0b0a1f]" style={{ borderColor: got ? color : "var(--border)" }}>
                  <AchIcon icon={a.icon} color={color} size={34} locked={!got} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-head block text-[8px] uppercase leading-snug" style={{ color: got ? "var(--text)" : "var(--muted)" }}>
                    {secret ? "???" : a.name[lang]}
                  </span>
                  <span className="block text-[16px] leading-snug text-[var(--text-2)]">{secret ? T("Hidden achievement. Try poking around.", "Скрытое достижение. Поищи.") : a.desc[lang]}</span>
                  {a.max && a.max > 1 && !secret ? (
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 w-full max-w-[140px] bg-[var(--border)]">
                        <span className="block h-full" style={{ width: `${(cur / a.max) * 100}%`, background: color }} />
                      </span>
                      <span className="font-head text-[7px] text-[var(--muted)]">
                        {got ? a.max : cur}/{a.max}
                      </span>
                    </span>
                  ) : null}
                  <span className="font-head mt-1 block text-[6px] uppercase" style={{ color }}>
                    {TIER_LABEL[a.tier][lang]}
                    {got ? ` · ${T("unlocked", "получено")}` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        {demo && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t-2 border-[var(--divider)] p-3">
            <button type="button" onClick={previewNext} className="pixel-btn font-head h-9 border-2 border-[var(--accent)] px-3 text-[8px] uppercase text-[var(--text)]" data-ach-preview>
              ▶ {T("Preview an unlock", "Показать получение")}
            </button>
            <button type="button" onClick={() => achActions.reset()} className="font-head h-9 px-2 text-[7px] uppercase text-[var(--muted)] hover:text-[#ff8a6c]">
              {T("Reset in this browser", "Сбросить в этом браузере")}
            </button>
            <span className="text-[15px] text-[var(--muted)]">{T("Demo only: click any card to see its pop-up without earning it.", "Только в демо: нажми на любую карточку, чтобы увидеть её окно, не получая достижение.")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
