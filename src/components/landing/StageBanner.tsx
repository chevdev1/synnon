"use client";

import { useEffect, useRef, useState } from "react";
import { achActions } from "@/lib/achStore";
import { useHelp } from "@/lib/help";
import { sfx } from "@/lib/sfx";
import { skyActions } from "@/lib/sky";
import { useStage } from "@/lib/useStage";

// "The mind has grown": shown when the stage goes up while you watch, or when it grew
// since your last visit. (The console's /stage n shows it too, as a preview.)
export default function StageBanner() {
  const { stage, realStage, forced, mode } = useStage();
  const { lang } = useHelp();
  const [shown, setShown] = useState<{ id: number; away: boolean; preview: boolean } | null>(null);
  const prev = useRef<number | null>(null);
  const key = `synnod-stage-seen-${mode}`;

  useEffect(() => {
    // first look: did it grow since the last visit?
    if (prev.current == null) {
      prev.current = stage.id;
      let seen = -1;
      try {
        seen = Number(window.localStorage.getItem(key) ?? -1);
      } catch {
        /* ignore */
      }
      if (!forced && seen >= 0 && stage.id > seen) setShown({ id: stage.id, away: true, preview: false });
    } else if (stage.id > prev.current) {
      setShown({ id: stage.id, away: false, preview: forced });
      if (!forced) achActions.unlock("growing-up");
    }
    prev.current = stage.id;
    if (!forced) {
      try {
        window.localStorage.setItem(key, String(realStage.id));
      } catch {
        /* ignore */
      }
    }
  }, [stage.id, realStage.id, forced, key]);

  useEffect(() => {
    if (!shown) return;
    sfx.achieve(shown.id >= 5 ? "legend" : "gold");
    skyActions.pulse(1);
    const t = window.setTimeout(() => setShown(null), shown.id >= 5 ? 9000 : 7000);
    return () => window.clearTimeout(t);
  }, [shown]);

  if (!shown) return null;
  const s = stage.id === shown.id ? stage : stage;
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[68] flex justify-center" role="status" aria-live="polite" data-stage-banner>
      <button
        type="button"
        onClick={() => setShown(null)}
        className="ach-in pointer-events-auto relative w-full max-w-[460px] overflow-hidden border-2 border-[var(--lime)] bg-[#080a20] p-3 text-center shadow-[4px_4px_0_rgba(196,242,96,0.3),0_0_26px_rgba(196,242,96,0.25)]"
      >
        <span className="ach-shine pointer-events-none absolute inset-0" style={{ ["--c" as string]: "#c4f260" }} />
        <span className="font-head relative block text-[7px] uppercase text-[var(--lime)]">
          {shown.away ? (lang === "ru" ? "Пока тебя не было, разум вырос" : "While you were away, the mind grew") : lang === "ru" ? "Разум вырос" : "The mind has grown"}
          {shown.preview ? (lang === "ru" ? " · пример" : " · preview") : ""}
        </span>
        <span className="font-head relative mt-2 block text-[13px] uppercase text-[var(--text)]">
          {shown.id}/5 · {s.name[lang]}
        </span>
        <span className="relative mt-1.5 block text-[17px] leading-snug text-[var(--text-2)]">{s.blurb[lang]}</span>
      </button>
    </div>
  );
}
