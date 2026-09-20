"use client";

import { useEffect, useState } from "react";
import { useDemo } from "@/lib/demo";
import { useHelp } from "@/lib/help";
import { demoMoodWeek, MOOD_COLOR, MOOD_LIST, MOOD_NAME, type MoodWeek as Week } from "@/lib/mood";

// The mind's mood over the last seven days: each column is a day, split by how much of it the
// mind spent in each mood. The mood is derived from real activity (see server/mood.ts), so the
// chart is empty until the mind has really lived a while. In the demo it is simulated.
export default function MoodWeek({ compact = false }: { compact?: boolean }) {
  const { on: demo } = useDemo();
  const { lang } = useHelp();
  const [live, setLive] = useState<Week | null>(null);
  const [now, setNow] = useState(0);
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);

  useEffect(() => {
    const t0 = window.setTimeout(() => setNow(Date.now()), 0);
    if (demo) return () => window.clearTimeout(t0);
    let cancelled = false;
    const load = () =>
      fetch("/api/mood", { cache: "no-store" })
        .then((r) => (r.ok ? (r.json() as Promise<Week>) : null))
        .then((w) => !cancelled && w && setLive(w))
        .catch(() => {});
    const first = window.setTimeout(load, 0);
    const id = window.setInterval(load, 5 * 60_000);
    return () => {
      cancelled = true;
      window.clearTimeout(t0);
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [demo]);

  const week = demo ? (now ? demoMoodWeek(now) : null) : live;
  if (!week) return null;
  const H = compact ? 26 : 64;
  const empty = week.dominant == null;
  const wd = (day: string) => new Date(day + "T00:00:00Z").toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { weekday: "short", timeZone: "UTC" }).slice(0, 2);

  if (compact) {
    return (
      <div data-mood-week data-help-id="moodweek" className="ml-auto shrink-0" title={(demo ? "[sim] " : "") + (empty ? T("Mood of the week: nothing recorded yet", "Настроение недели: пока ничего не записано") : T(`Mood of the week: mostly ${MOOD_NAME[week.dominant!].en}`, `Настроение недели: больше ${MOOD_NAME[week.dominant!].ru}`))}>
        <div className="font-head text-[6px] uppercase text-[var(--muted)]">{T("week", "неделя")}</div>
        <div className="mt-1 flex items-end gap-[3px]" style={{ height: H }}>
          {week.days.map((d) => {
            const total = MOOD_LIST.reduce((s, m) => s + (d.counts[m] ?? 0), 0);
            return (
              <div key={d.day} className="flex w-[7px] flex-col-reverse overflow-hidden border border-[var(--border)]" style={{ height: H }}>
                {total > 0 ? MOOD_LIST.map((m) => ((d.counts[m] ?? 0) > 0 ? <div key={m} style={{ height: `${((d.counts[m] ?? 0) / total) * 100}%`, background: MOOD_COLOR[m] }} /> : null)) : <div className="h-full w-full bg-[var(--border)]/30" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div data-mood-week>
      <div className="font-head text-[7px] uppercase text-[var(--muted)]">
        {T("Mood of the week", "Настроение недели")}
        {demo ? ` · ${T("simulated", "симуляция")}` : ""}
      </div>
      <div className="mt-2 flex items-end gap-1.5" style={{ height: H + 14 }}>
        {week.days.map((d) => {
          const total = MOOD_LIST.reduce((s, m) => s + (d.counts[m] ?? 0), 0);
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1" title={d.day}>
              <div className="flex w-full flex-col-reverse overflow-hidden border border-[var(--border)]" style={{ height: H }}>
                {total > 0 ? (
                  MOOD_LIST.map((m) => {
                    const n = d.counts[m] ?? 0;
                    return n > 0 ? <div key={m} style={{ height: `${(n / total) * 100}%`, background: MOOD_COLOR[m] }} /> : null;
                  })
                ) : (
                  <div className="h-full w-full bg-[var(--border)]/30" />
                )}
              </div>
              <span className="font-head text-[6px] uppercase text-[var(--muted)]">{wd(d.day)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-[16px] leading-snug text-[var(--text-2)]">
        {empty ? T("Nothing recorded yet: the chart fills in as the mind really lives.", "Пока ничего не записано: график заполняется, пока разум живёт.") : T(`Mostly ${MOOD_NAME[week.dominant!].en} this week.`, `На этой неделе он больше ${MOOD_NAME[week.dominant!].ru}.`)}
      </p>
      {!compact && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-[var(--muted)]">
          {MOOD_LIST.map((m) => (
            <li key={m} className="flex items-center gap-1.5">
              <span className="h-2 w-2" style={{ background: MOOD_COLOR[m] }} />
              {MOOD_NAME[m][lang]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
