"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AchIcon from "@/components/achievements/AchIcon";
import AchievementsWatcher from "@/components/achievements/AchievementsWatcher";
import Atmosphere from "@/components/landing/Atmosphere";
import DemoToggle from "@/components/landing/DemoToggle";
import { HexIcon } from "@/components/ui/PixelIcon";
import { useDemo } from "@/lib/demo";
import { useHelp } from "@/lib/help";
import { LiveRoot } from "@/lib/live/LiveRoot";
import { useLive } from "@/lib/live/context";
import { STREAK_REWARDS, dayKey, questsForDay } from "@/lib/quests";
import { questActions, streakOf, useQuestBook } from "@/lib/questStore";

const nav =
  "pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--lime)]";
const FLAME = "#ff8a4c";

function Body() {
  const book = useQuestBook();
  const { lang } = useHelp();
  const { on: demo } = useDemo();
  const { currentUserNodeId } = useLive();
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const today = dayKey();
  const quests = questsForDay(today);
  const rec = book.days[today];
  const doneN = quests.filter((q) => rec?.d.includes(q.id)).length;
  const streak = streakOf(book, today);
  const [left, setLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const end = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime() - n.getTime();
      setLeft(`${Math.floor(end / 3_600_000)}h ${String(Math.floor((end % 3_600_000) / 60_000)).padStart(2, "0")}m`);
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const k = dayKey(d);
    return { k, n: book.days[k]?.d.length ?? 0, today: k === today };
  });

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--divider)] pb-3">
        <Link href="/" className="flex items-center gap-2.5">
          <HexIcon size={22} />
          <span className="font-head text-[11px] tracking-[0.35em] text-[var(--text)]">SYNNOD</span>
        </Link>
        <div className="flex items-center gap-2">
          <DemoToggle />
          <Link href="/achievements" className={nav}>
            {T("Achievements", "Достижения")}
          </Link>
          <Link href="/" className={nav}>
            ← Brain
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-5 py-5">
        <section className="border-2 p-4 md:p-5" style={{ borderColor: streak > 0 ? FLAME : "var(--border)", background: "color-mix(in srgb, var(--panel) 76%, transparent)", boxShadow: streak > 0 ? "5px 5px 0 rgba(255,138,76,0.25)" : "none" }} data-daily-hero>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center border-2 bg-[#0b0a1f]" style={{ borderColor: streak > 0 ? FLAME : "var(--border)" }}>
              <AchIcon icon="flame" color={FLAME} size={44} locked={streak === 0} />
            </span>
            <div>
              <div className="font-head text-[8px] uppercase text-[var(--muted)]">{T("Streak", "Серия")}</div>
              <div className="font-head mt-1 text-[22px]" style={{ color: streak > 0 ? FLAME : "var(--muted)" }} data-streak>
                {streak} <span className="text-[11px] text-[var(--muted)]">{T(streak === 1 ? "day" : "days", "дн.")}</span>
              </div>
              <div className="text-[16px] text-[var(--text-2)]">
                {T(`Best: ${book.streak.best}.`, `Рекорд: ${book.streak.best}.`)}{" "}
                {T("A day counts once you finish one quest.", "День засчитывается, когда выполнено хотя бы одно задание.")}
              </div>
            </div>
            <div className="ml-auto text-right text-[16px] text-[var(--muted)]">
              <div>{T("New quests in", "Новые задания через")}</div>
              <div className="font-head text-[10px] text-[var(--text)]">{left}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-1" aria-label={T("Last 14 days", "Последние 14 дней")}>
            {days.map((d) => (
              <span key={d.k} title={`${d.k}: ${d.n}/3`} className="h-4 flex-1 border" style={{ borderColor: d.today ? "var(--lime)" : "var(--border)", background: d.n >= 3 ? "#ffd166" : d.n >= 1 ? FLAME : "transparent" }} data-cal-day={d.n} />
            ))}
          </div>
        </section>

        <section>
          <div className="font-head mb-2 flex items-center justify-between text-[9px] uppercase text-[var(--text)]">
            <span>{T("Today's quests", "Задания на сегодня")}</span>
            <span className="text-[var(--lime)]" data-quests-done>
              {doneN}/{quests.length}
            </span>
          </div>
          <ul className="space-y-2">
            {quests.map((q) => {
              const done = !!rec?.d.includes(q.id);
              const p = done ? q.target : Math.min(q.target, rec?.p[q.id] ?? 0);
              const blocked = q.needsCell && currentUserNodeId == null && !demo;
              return (
                <li
                  key={q.id}
                  data-quest-id={q.id}
                  data-quest-state={done ? "done" : "open"}
                  onClick={demo && !done ? () => questActions.demoAdvance(q.id) : undefined}
                  title={demo ? T("Demo: click to make progress", "Демо: нажми, чтобы продвинуться") : undefined}
                  className={`flex items-center gap-3 border-2 p-3 ${demo && !done ? "cursor-pointer hover:brightness-125" : ""}`}
                  style={{ borderColor: done ? "var(--lime)" : "var(--border)", background: done ? "rgba(196,242,96,0.08)" : "rgba(8,10,32,0.55)" }}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 text-[14px]" style={{ borderColor: done ? "var(--lime)" : "var(--border)", color: done ? "var(--lime)" : "var(--muted)" }}>
                    {done ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-head block text-[9px] uppercase text-[var(--text)]">{q.name[lang]}</span>
                    <span className="block text-[17px] leading-snug text-[var(--text-2)]">{q.desc[lang]}</span>
                    {q.target > 1 && (
                      <span className="mt-1.5 flex items-center gap-2">
                        <span className="h-1.5 w-full max-w-[160px] bg-[var(--border)]">
                          <span className="block h-full bg-[var(--lime)]" style={{ width: `${(p / q.target) * 100}%` }} />
                        </span>
                        <span className="font-head text-[7px] text-[var(--muted)]">
                          {p}/{q.target}
                        </span>
                      </span>
                    )}
                    {blocked && <span className="mt-1 block text-[15px] text-[#ffd166]">{T("Needs a cell of your own.", "Нужна своя клетка.")}</span>}
                  </span>
                  {!done && q.href && (
                    <Link href={q.href} onClick={(e) => e.stopPropagation()} className="font-head shrink-0 text-[8px] uppercase text-[var(--link)] hover:text-[var(--lime)]">
                      {T("Go →", "Перейти →")}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <div className="font-head mb-2 text-[9px] uppercase text-[var(--text)]">{T("Streak rewards", "Награды за серию")}</div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {STREAK_REWARDS.map((r) => {
              const got = book.streak.best >= r.days;
              return (
                <li key={r.days} data-reward={r.days} data-reward-state={got ? "got" : "ahead"} className="flex items-center gap-3 border-2 p-2.5" style={{ borderColor: got ? FLAME : "var(--border)", opacity: got ? 1 : 0.75 }}>
                  <AchIcon icon="flame" color={FLAME} size={26} locked={!got} />
                  <span>
                    <span className="font-head block text-[8px] uppercase" style={{ color: got ? FLAME : "var(--muted)" }}>
                      {r.days} {T("days", "дней")}
                    </span>
                    <span className="text-[16px] leading-snug text-[var(--text-2)]">{r.text[lang]}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {demo && (
          <p className="text-[15px] leading-snug text-[var(--muted)]">
            {T("Demo: the quest book is simulated and separate from live mode. Click a quest to make progress; ", "Демо: книга заданий симулированная и отдельная от live. Нажми на задание, чтобы продвинуться; ")}
            <button type="button" onClick={() => questActions.reset()} className="font-head text-[7px] uppercase text-[var(--muted)] hover:text-[#ff8a6c]">
              {T("reset", "сбросить")}
            </button>
          </p>
        )}
      </main>
    </div>
  );
}

export default function DailyPage() {
  return (
    <LiveRoot>
      <div className="relative min-h-dvh bg-[var(--bg)]">
        <Atmosphere />
        <AchievementsWatcher />
        <Body />
      </div>
    </LiveRoot>
  );
}
