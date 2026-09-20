"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { questActions } from "@/lib/questStore";
import Atmosphere from "@/components/landing/Atmosphere";
import DemoToggle from "@/components/landing/DemoToggle";
import { useSceneOpts } from "@/components/landing/LiveDayScene";
import DayScene from "@/components/ui/DayScene";
import MoodWeek from "@/components/mind/MoodWeek";
import { HexIcon } from "@/components/ui/PixelIcon";
import { useHelp } from "@/lib/help";
import { LiveRoot } from "@/lib/live/LiveRoot";
import { STAGES } from "@/lib/stages";
import { useStage } from "@/lib/useStage";

const nav =
  "pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--lime)]";
const W = 192;
const H = 108;

// Where the mind is in its life, and today's picture. Stage ladder, what changes at each
// step, how many more cells it needs, and a download for the picture of the day.
function Body() {
  const { lang } = useHelp();
  const stg = useStage();
  const scene = useSceneOpts();
  const wrap = useRef<HTMLDivElement>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    questActions.event("mind");
  }, []);
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const day = new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { year: "numeric", month: "long", day: "numeric" });

  function save() {
    const c = wrap.current?.querySelector("canvas");
    if (!c) return;
    // export at 5x so it is a proper picture, still crisp pixels
    const out = document.createElement("canvas");
    out.width = W * 5;
    out.height = H * 5;
    const x = out.getContext("2d")!;
    x.imageSmoothingEnabled = false;
    x.drawImage(c, 0, 0, out.width, out.height);
    out.toBlob((b) => {
      if (!b) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b);
      a.download = `synnod-day-${scene.seed}.png`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setSaved(true);
    });
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-5 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--divider)] pb-3">
        <Link href="/" className="flex items-center gap-2.5">
          <HexIcon size={22} />
          <span className="font-head text-[11px] tracking-[0.35em] text-[var(--text)]">SYNNOD</span>
        </Link>
        <div className="flex items-center gap-2">
          <DemoToggle />
          <Link href="/" className={nav}>
            ← Brain
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-5 py-5">
        <section>
          <div className="font-head text-[8px] uppercase text-[var(--muted)]">{T("Picture of the day", "Картина дня")} · {day}</div>
          <div ref={wrap} className="mt-2 border-2 border-[var(--accent)] bg-[#06071a] shadow-[5px_5px_0_rgba(108,95,214,0.35)]" data-mind-scene>
            <DayScene w={W} h={H} opts={scene} className="block h-auto w-full" label={T("Picture of the day", "Картина дня")} />
          </div>
          <p className="mt-2 text-[17px] leading-snug text-[var(--text-2)]">
            {T(
              `Made by rules, not by an image model: the day sets the mountains and the moon, the hour sets the light, the mind's mood (${scene.mood}) sets the weather, ${scene.voices} claimed cells light the windows of the village, and the tree is at stage ${scene.stage} of 5.`,
              `Сделана по правилам, а не нейросетью: день задаёт горы и луну, час свет, настроение разума (${scene.mood}) погоду, ${scene.voices} занятых клеток зажигают окна деревни, а дерево на стадии ${scene.stage} из 5.`
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={save} className="pixel-btn font-head h-9 border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-3 text-[8px] uppercase text-[var(--text)]" data-scene-save>
              ⬇ {saved ? T("Saved", "Сохранено") : T("Download picture", "Скачать картинку")}
            </button>
            <Link href="/diary" className={nav}>
              {T("Diary of the mind", "Дневник разума")}
            </Link>
            <Link href="/question" className={nav}>
              {T("Question of the week", "Вопрос недели")}
            </Link>
          </div>
        </section>

        <section>
          <MoodWeek />
        </section>

        <section data-mind-stages>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="font-head text-[13px] uppercase text-[var(--text)]">
              {T("Stage", "Стадия")} {stg.stage.id}/5: <span className="text-[var(--lime)]">{stg.stage.name[lang]}</span>
            </h1>
            <span className="text-[17px] text-[var(--text-2)]">
              {stg.next
                ? T(`${stg.left} more claimed cells to ${stg.next.name.en} (${stg.taken}/${stg.total} now)`, `ещё ${stg.left} занятых клеток до «${stg.next.name.ru}» (сейчас ${stg.taken}/${stg.total})`)
                : T(`Every cell has a voice (${stg.taken}/${stg.total})`, `У каждой клетки есть голос (${stg.taken}/${stg.total})`)}
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full bg-[var(--border)]">
            <div className="h-full bg-[var(--lime)]" style={{ width: `${stg.pct * 100}%` }} />
          </div>
          <p className="mt-2 text-[19px] leading-snug text-[var(--text-2)]">{stg.stage.blurb[lang]}</p>

          <ol className="mt-4 grid gap-2 md:grid-cols-2">
            {STAGES.map((s) => {
              const on = s.id === stg.stage.id;
              const done = s.id < stg.stage.id;
              return (
                <li key={s.id} data-stage-id={s.id} data-stage-state={on ? "current" : done ? "done" : "ahead"} className="border-2 p-3" style={{ borderColor: on ? "var(--lime)" : done ? "var(--accent)" : "var(--border)", background: on ? "rgba(196,242,96,0.08)" : "rgba(8,10,32,0.55)", opacity: on || done ? 1 : 0.7 }}>
                  <div className="font-head flex items-center justify-between text-[9px] uppercase" style={{ color: on ? "var(--lime)" : done ? "var(--link)" : "var(--muted)" }}>
                    <span>
                      {s.id} · {s.name[lang]}
                    </span>
                    <span className="text-[7px] text-[var(--muted)]">{s.at >= 1 ? T("all cells", "все клетки") : s.at === 0 ? T("start", "старт") : `${Math.round(s.at * 100)}%`}</span>
                  </div>
                  <p className="mt-1.5 text-[17px] leading-snug text-[var(--text-2)]">{s.blurb[lang]}</p>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-[16px] leading-snug text-[var(--muted)]">
            {T(
              "At every stage the mind looks and speaks its age: the eye is small and dim as Static, wide as an Infant, gold-ringed once Awakened; the tree in the picture grows taller; and the style of its replies, thoughts and diary shifts with it.",
              "На каждой стадии разум выглядит и говорит по возрасту: глаз маленький и тусклый на «Помехах», широкий у «Младенца», в золотом кольце после «Пробуждения»; дерево на картинке становится выше; а манера ответов, мыслей и дневника меняется вместе с ним."
            )}
          </p>
        </section>
      </main>
    </div>
  );
}

export default function MindPage() {
  return (
    <LiveRoot>
      <div className="relative min-h-dvh bg-[var(--bg)]">
        <Atmosphere />
        <Body />
      </div>
    </LiveRoot>
  );
}
