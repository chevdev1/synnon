"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Atmosphere from "@/components/landing/Atmosphere";
import DemoToggle from "@/components/landing/DemoToggle";
import { HexIcon } from "@/components/ui/PixelIcon";
import { GOAL_TIERS } from "@/lib/goal";
import { useGoal } from "@/lib/goalStore";
import { useHelp } from "@/lib/help";

const nav =
  "pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--lime)]";
const GOLD = "#ffd166";

export default function GoalPage() {
  const { goal, tier, pct, forced } = useGoal();
  const { lang } = useHelp();
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const [left, setLeft] = useState("");

  useEffect(() => {
    if (!goal) return;
    const tick = () => {
      const ms = Math.max(0, goal.endsAt - Date.now());
      const d = Math.floor(ms / 86_400_000);
      setLeft(`${d}d ${Math.floor((ms % 86_400_000) / 3_600_000)}h ${String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, "0")}m`);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [goal]);

  return (
    <div className="relative min-h-dvh bg-[var(--bg)]">
      <Atmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-4">
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
          {!goal ? (
            <p className="text-[18px] text-[var(--muted)]">{T("The goal isn't available right now.", "Цель сейчас недоступна.")}</p>
          ) : (
            <>
              <section className="border-2 p-4 md:p-6" style={{ borderColor: GOLD, background: "color-mix(in srgb, var(--panel) 76%, transparent)", boxShadow: "5px 5px 0 rgba(255,209,102,0.25)" }} data-goal-hero>
                <div className="font-head text-[8px] uppercase text-[var(--muted)]">
                  {T("Community goal", "Цель сообщества")} · {goal.week}
                  {goal.source === "demo" ? ` · ${T("simulated", "симуляция")}` : ""}
                  {forced ? ` · ${T("preview", "пример")}` : ""}
                </div>
                <div className="font-head mt-2 text-[22px]" style={{ color: GOLD }} data-goal-count>
                  {goal.count}
                  <span className="text-[12px] text-[var(--muted)]"> / {goal.target} {T("voices", "голосов")}</span>
                </div>
                <div className="relative mt-3 h-4 w-full bg-[var(--border)]">
                  <div className="h-full" style={{ width: `${pct * 100}%`, background: GOLD }} />
                  {GOAL_TIERS.map((t, i) => (
                    <span key={i} className="absolute top-[-3px] h-[22px] w-[3px]" style={{ left: `calc(${t.at * 100}% - 1px)`, background: tier > i ? "#fff" : "#4d5680" }} />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[17px] text-[var(--text-2)]">
                  <span>{T(`${goal.contributors} cells took part`, `участвовали ${goal.contributors} клеток`)}</span>
                  <span>{T("Resets in", "Сброс через")} {left}</span>
                </div>
              </section>

              <section>
                <div className="font-head mb-2 text-[9px] uppercase text-[var(--text)]">{T("What the community unlocks", "Что открывает сообщество")}</div>
                <ol className="space-y-2" data-goal-tiers>
                  {GOAL_TIERS.map((t, i) => {
                    const got = tier > i;
                    return (
                      <li key={i} data-tier={i + 1} data-tier-state={got ? "reached" : "ahead"} className="flex items-center gap-3 border-2 p-3" style={{ borderColor: got ? GOLD : "var(--border)", background: got ? "rgba(255,209,102,0.08)" : "rgba(8,10,32,0.55)", opacity: got ? 1 : 0.8 }}>
                        <span className="font-head flex h-10 w-10 shrink-0 items-center justify-center border-2 text-[10px]" style={{ borderColor: got ? GOLD : "var(--border)", color: got ? GOLD : "var(--muted)" }}>
                          {i + 1}
                        </span>
                        <span>
                          <span className="font-head block text-[9px] uppercase" style={{ color: got ? GOLD : "var(--text-2)" }}>
                            {t.name[lang]} · {Math.round(t.at * 100)}% ({Math.ceil(goal.target * t.at)})
                          </span>
                          <span className="text-[17px] leading-snug text-[var(--text-2)]">{t.desc[lang]}</span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2 text-[15px] leading-snug text-[var(--muted)]">
                  {T("The effects are for everyone, on every page, until the week ends and the counter starts over.", "Эффекты для всех, на каждой странице, пока неделя не закончится и счётчик не начнётся заново.")}
                </p>
              </section>

              <section>
                <div className="font-head mb-2 text-[9px] uppercase text-[var(--text)]">{T("How to add your voice", "Как добавить свой голос")}</div>
                <ul className="space-y-2 text-[19px] leading-snug text-[var(--text-2)]">
                  <li>
                    {T("Tell the mind something through your cell: every reply that passes moderation counts as one.", "Расскажи разуму что-нибудь через свою клетку: каждый ответ, прошедший модерацию, засчитывается за один.")}{" "}
                    <Link href="/" className="text-[var(--link)] underline hover:text-[var(--lime)]">
                      {T("Go to the brain →", "К мозгу →")}
                    </Link>
                  </li>
                  <li>
                    {T("Answer the question of the week: each approved answer counts too.", "Ответь на вопрос недели: каждый одобренный ответ тоже считается.")}{" "}
                    <Link href="/question" className="text-[var(--link)] underline hover:text-[var(--lime)]">
                      {T("Question →", "Вопрос →")}
                    </Link>
                  </li>
                  <li>{T("Nothing is counted for spending anything or for repeating yourself: it is about how many different moments the community shared.", "Ничего не считается за траты или повторы: важно, сколько разных моментов сообщество разделило.")}</li>
                </ul>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
