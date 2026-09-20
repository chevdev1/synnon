"use client";

import { useEffect, useState } from "react";
import { useDemo } from "@/lib/demo";
import { useHelp } from "@/lib/help";
import { sfx } from "@/lib/sfx";
import { SKINS } from "@/lib/skins";
import { demoSkinActions, useDemoSkin } from "@/lib/skinStore";

// "Cell style" inside the companion panel: pick how your own cell looks to everybody.
// Styles are earned by speaking through the cell (checked on the server); in the demo all
// are open and the choice stays in this browser.
interface Info {
  skin: string | null;
  voices: number;
  skins: { id: string; unlocked: boolean; needVoices: number }[];
}

export default function SkinPicker({ hasCell }: { hasCell: boolean }) {
  const { on: demo } = useDemo();
  const { lang } = useHelp();
  const demoSkin = useDemoSkin();
  const [info, setInfo] = useState<Info | null>(null);
  const [err, setErr] = useState("");
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);

  useEffect(() => {
    if (demo || !hasCell) return;
    let cancelled = false;
    fetch("/api/skin", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Info>) : null))
      .then((d) => !cancelled && d && setInfo(d))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [demo, hasCell]);

  if (!hasCell) return null;
  const cur = demo ? demoSkin : info?.skin ?? null;
  if (!demo && !info) return null;

  async function pick(id: string | null) {
    setErr("");
    if (demo) {
      demoSkinActions.set(id);
      sfx.found();
      return;
    }
    try {
      const r = await fetch("/api/skin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ skin: id }) });
      const d = await r.json();
      if (!r.ok) return setErr(d.error ?? "error");
      setInfo(d as Info);
      sfx.found();
      window.dispatchEvent(new Event("synnod:refresh-nodes"));
    } catch {
      setErr(T("No connection.", "Нет связи."));
    }
  }

  return (
    <div className="mt-2 border-t-2 border-[var(--divider)] pt-2" data-skin-picker data-help-id="skin">
      <div className="font-head text-[7px] uppercase text-[var(--muted)]">
        {T("Cell style", "Стиль клетки")} · {T("everybody sees it", "видят все")}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => void pick(null)}
          data-skin-id="none"
          aria-pressed={!cur}
          className="font-head border-2 px-1.5 py-1 text-[6px] uppercase"
          style={{ borderColor: !cur ? "var(--lime)" : "var(--border)", color: !cur ? "var(--lime)" : "var(--muted)" }}
        >
          {T("plain", "обычная")}
        </button>
        {SKINS.map((s) => {
          const unlocked = demo || !!info?.skins.find((x) => x.id === s.id)?.unlocked;
          const on = cur === s.id;
          return (
            <button
              key={s.id}
              type="button"
              data-skin-id={s.id}
              data-skin-state={unlocked ? (on ? "selected" : "free") : "locked"}
              aria-disabled={!unlocked}
              title={unlocked ? s.desc[lang] : T(`Locked: ${s.needVoices} voices needed (you have ${info?.voices ?? 0})`, `Закрыто: нужно ${s.needVoices} голосов (у тебя ${info?.voices ?? 0})`)}
              onClick={() => unlocked && void pick(s.id)}
              className={`font-head flex items-center gap-1 border-2 px-1.5 py-1 text-[6px] uppercase ${unlocked ? "" : "cursor-not-allowed"}`}
              style={{ borderColor: on ? s.color : "var(--border)", color: unlocked ? s.color : "var(--faint)", background: on ? `${s.color}22` : "transparent" }}
            >
              <span className="h-2 w-2" style={{ background: unlocked ? s.color : "#3a4180" }} />
              {unlocked ? "" : "× "}
              {s.name[lang]}
              {unlocked ? "" : ` ${s.needVoices}`}
            </button>
          );
        })}
      </div>
      {err && <p className="mt-1 text-[14px] text-[#ff8a6c]">{err}</p>}
      {!demo && info && <p className="mt-1 text-[14px] leading-snug text-[var(--muted)]">{T(`Styles open as you speak through your cell (${info.voices} voices so far).`, `Стили открываются, когда ты говоришь через клетку (пока голосов: ${info.voices}).`)}</p>}
    </div>
  );
}
