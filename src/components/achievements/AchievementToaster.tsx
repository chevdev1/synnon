"use client";

import { useEffect } from "react";
import { ACH_BY_ID, TIER_COLOR, TIER_LABEL } from "@/lib/achievements";
import { achActions, useToastQueue } from "@/lib/achStore";
import { useHelp } from "@/lib/help";
import AchIcon from "./AchIcon";

const SHOW_MS = { bronze: 4200, silver: 4800, gold: 5800, legend: 7200 } as const;

// Steam-style pop-up, bottom right (bottom centre on phones). Rarer = longer, louder and
// with a shower of pixel sparks. Queued, one at a time; lives in the root layout so it
// works on every page.
export default function AchievementToaster() {
  const queue = useToastQueue();
  const { lang } = useHelp();
  const cur = queue[0];
  const ach = cur && "id" in cur ? ACH_BY_ID.get(cur.id) : undefined;
  const tier = ach?.tier ?? "silver";

  useEffect(() => {
    if (!cur) return;
    if (ach) achActions.playFor(ach.tier);
    const t = window.setTimeout(() => achActions.shift(), ach ? SHOW_MS[ach.tier] : 4200);
    return () => window.clearTimeout(t);
    // key on the toast itself: a new queue head restarts the timer
  }, [cur, ach]);

  if (!cur) return null;
  const color = TIER_COLOR[tier];
  const spark = tier === "gold" || tier === "legend";

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[70] flex justify-center sm:inset-x-auto sm:right-4 sm:bottom-4 sm:justify-end" aria-live="polite" role="status" data-ach-toast>
      <button
        type="button"
        key={"id" in cur ? cur.id : "restored"}
        onClick={() => achActions.shift()}
        className="ach-in pointer-events-auto relative flex w-full max-w-[380px] items-center gap-3 overflow-hidden border-2 bg-[#080a20] p-3 text-left"
        style={{ borderColor: color, boxShadow: `4px 4px 0 ${color}55, 0 0 22px ${color}33` }}
      >
        <span className="ach-shine pointer-events-none absolute inset-0" style={{ ["--c" as string]: color }} />
        {"id" in cur && ach ? (
          <>
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center border-2 bg-[#0b0a1f]" style={{ borderColor: color }}>
              <AchIcon icon={ach.icon} color={color} size={40} />
              {spark &&
                Array.from({ length: 12 }, (_, i) => (
                  <i
                    key={i}
                    className="ach-spark absolute left-1/2 top-1/2 h-1 w-1"
                    style={{ background: i % 3 === 0 ? "#fff" : color, ["--dx" as string]: `${Math.cos(i * 0.52) * (30 + (i % 4) * 8)}px`, ["--dy" as string]: `${Math.sin(i * 0.52) * (30 + (i % 3) * 9)}px`, animationDelay: `${(i % 4) * 90}ms` }}
                  />
                ))}
            </span>
            <span className="relative min-w-0">
              <span className="font-head block text-[7px] uppercase" style={{ color }}>
                {lang === "ru" ? "Достижение получено" : "Achievement unlocked"} · {TIER_LABEL[ach.tier][lang]}
                {cur.preview ? (lang === "ru" ? " · пример" : " · preview") : ""}
              </span>
              <span className="font-head mt-1.5 block text-[10px] uppercase leading-snug text-[var(--text)]">{ach.name[lang]}</span>
              <span className="mt-1 block text-[17px] leading-snug text-[var(--text-2)]">{ach.desc[lang]}</span>
            </span>
          </>
        ) : (
          <span className="relative">
            <span className="font-head block text-[7px] uppercase" style={{ color }}>
              {lang === "ru" ? "Прогресс восстановлен" : "Progress restored"}
            </span>
            <span className="mt-1 block text-[17px] leading-snug text-[var(--text-2)]">
              {"text" in cur ? (lang === "ru" ? `Разум узнал тебя: ${cur.text} достижений вернулись.` : `The mind recognised you: ${cur.text} achievements are back.`) : ""}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
