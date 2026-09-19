"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Atmosphere from "@/components/landing/Atmosphere";
import DemoToggle from "@/components/landing/DemoToggle";
import { HexIcon } from "@/components/ui/PixelIcon";
import { ACHIEVEMENTS, CATS, MAX_SCORE, POINTS, TIER_COLOR, TIER_LABEL, catOf, levelOf, type Ach, type Tier } from "@/lib/achievements";
import { achActions, useAch } from "@/lib/achStore";
import { useDemo } from "@/lib/demo";
import { useHelp } from "@/lib/help";
import { LiveRoot } from "@/lib/live/LiveRoot";
import AchIcon from "./AchIcon";
import AchievementsWatcher from "./AchievementsWatcher";

const TIERS: Tier[] = ["bronze", "silver", "gold", "legend"];
type Status = "all" | "unlocked" | "locked";
type Stats = { cells: number; users: number; counts: Record<string, number>; base: Record<string, "cells" | "users"> };

// Simulated rarity for the demo (clearly marked); live numbers come from /api/achievements/stats.
const DEMO_RARITY: Record<string, number> = { "first-cell": 71, "first-words": 62, chatter: 28, storyteller: 9, chorus: 1.6, "thought-seed": 34, "mind-weaver": 6.5, "long-memory": 19, "share-of-mind": 4.2, uplink: 48, "anonymous-signal": 52 };

const nav =
  "pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--lime)]";
const chip = (on: boolean) =>
  `pixel-btn font-head h-8 border-2 px-2.5 text-[7px] uppercase ${on ? "text-[#06071a]" : "text-[var(--text-2)]"}`;

function Body() {
  const { unlocked, prog } = useAch();
  const { lang } = useHelp();
  const { on: demo } = useDemo();
  const [status, setStatus] = useState<Status>("all");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [stats, setStats] = useState<Stats | null>(null);
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    fetch("/api/achievements/stats", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Stats>) : null))
      .then((s) => !cancelled && s && setStats(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [demo]);

  // percent of holders (cells or people), or null when there is no global number for it
  const rarity = (id: string): number | null => {
    if (demo) return DEMO_RARITY[id] ?? null;
    if (!stats || !(id in stats.counts)) return null;
    const base = stats.base[id] === "users" ? stats.users : stats.cells;
    return base > 0 ? Math.round((stats.counts[id] / base) * 1000) / 10 : null;
  };

  const got = ACHIEVEMENTS.filter((a) => unlocked[a.id]);
  const score = got.reduce((s, a) => s + POINTS[a.tier], 0);
  const lv = levelOf(score);
  const recent = [...got].sort((a, b) => unlocked[b.id] - unlocked[a.id]).slice(0, 3);
  const rarest = got.map((a) => ({ a, r: rarity(a.id) })).filter((x): x is { a: Ach; r: number } => x.r != null).sort((x, y) => x.r - y.r)[0];

  const visible = useMemo(
    () => ACHIEVEMENTS.filter((a) => (status === "all" || (status === "unlocked") === !!unlocked[a.id]) && (tier === "all" || a.tier === tier)),
    [status, tier, unlocked]
  );

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-4">
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

      <main className="flex-1 space-y-4 py-5">
        {/* Score, level, breakdown */}
        <section className="border-2 border-[#ffd166] bg-[color-mix(in_srgb,var(--panel)_76%,transparent)] p-4 shadow-[5px_5px_0_rgba(255,209,102,0.25)] md:p-6" data-ach-hero>
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex h-20 w-20 items-center justify-center border-2 border-[#ffd166] bg-[#0b0a1f]">
              <AchIcon icon="trophy" color="#ffd166" size={56} />
            </span>
            <div className="min-w-[220px] flex-1">
              <div className="font-head text-[8px] uppercase text-[var(--muted)]">{T("Mind Score", "Очки разума")}</div>
              <div className="font-head mt-1 text-[22px] text-[#ffd166]" data-ach-score>
                {score}
                <span className="text-[12px] text-[var(--muted)]"> / {MAX_SCORE}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="font-head text-[9px] uppercase text-[var(--text)]" data-ach-level>
                  {T("Level", "Уровень")} {lv.index + 1}: {lv.level.name[lang]}
                </span>
                {lv.next && (
                  <span className="text-[15px] text-[var(--muted)]">
                    {T(`${lv.next.at - score} to ${lv.next.name.en}`, `${lv.next.at - score} до «${lv.next.name.ru}»`)}
                  </span>
                )}
              </div>
              <div className="mt-2 h-2.5 w-full max-w-md bg-[var(--border)]">
                <div className="h-full bg-[#ffd166]" style={{ width: `${lv.pct * 100}%` }} />
              </div>
            </div>
            <div className="text-[18px] leading-snug text-[var(--text-2)]">
              <div data-ach-count>
                {T(`${got.length} of ${ACHIEVEMENTS.length} unlocked`, `Получено ${got.length} из ${ACHIEVEMENTS.length}`)}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {TIERS.map((t) => (
                  <span key={t} className="font-head text-[7px] uppercase" style={{ color: TIER_COLOR[t] }}>
                    {ACHIEVEMENTS.filter((a) => a.tier === t && unlocked[a.id]).length}/{ACHIEVEMENTS.filter((a) => a.tier === t).length} {TIER_LABEL[t][lang]} · +{POINTS[t]}
                  </span>
                ))}
              </div>
              {rarest && (
                <div className="mt-2 text-[16px] text-[var(--muted)]" data-ach-rarest>
                  {T("Your rarest", "Твоё самое редкое")}: <span style={{ color: TIER_COLOR[rarest.a.tier] }}>{rarest.a.name[lang]}</span> ({rarest.r}%)
                </div>
              )}
            </div>
          </div>
        </section>

        {recent.length > 0 && (
          <section data-ach-recent>
            <div className="font-head mb-2 text-[9px] uppercase text-[var(--text)]">{T("Recently unlocked", "Недавно получено")}</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {recent.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 border-2 bg-[#0b0a1f]/80 p-2" style={{ borderColor: TIER_COLOR[a.tier] }}>
                  <AchIcon icon={a.icon} color={TIER_COLOR[a.tier]} size={30} />
                  <span className="min-w-0">
                    <span className="font-head block truncate text-[8px] uppercase text-[var(--text)]">{a.name[lang]}</span>
                    <span className="text-[15px] text-[var(--muted)]">{new Date(unlocked[a.id]).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { month: "short", day: "numeric" })}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="flex flex-wrap items-center gap-2" data-ach-filters>
          {(["all", "unlocked", "locked"] as Status[]).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)} className={chip(status === s)} style={{ borderColor: "var(--accent)", background: status === s ? "var(--accent)" : "transparent" }} data-filter-status={s}>
              {s === "all" ? T("All", "Все") : s === "unlocked" ? T("Unlocked", "Полученные") : T("Locked", "Закрытые")}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-[var(--border)]" />
          {(["all", ...TIERS] as (Tier | "all")[]).map((t) => (
            <button key={t} type="button" onClick={() => setTier(t)} className={chip(tier === t)} style={{ borderColor: t === "all" ? "var(--accent)" : TIER_COLOR[t], background: tier === t ? (t === "all" ? "var(--accent)" : TIER_COLOR[t]) : "transparent", color: tier === t ? "#06071a" : t === "all" ? "var(--text-2)" : TIER_COLOR[t] }} data-filter-tier={t}>
              {t === "all" ? T("Any rarity", "Любая редкость") : TIER_LABEL[t][lang]}
            </button>
          ))}
        </section>

        {/* Grouped list */}
        {visible.length === 0 ? (
          <p className="border-2 border-dashed border-[var(--border)] p-4 text-[19px] text-[var(--muted)]">{T("Nothing matches these filters.", "По этим фильтрам ничего нет.")}</p>
        ) : (
          CATS.map((c) => {
            const list = visible.filter((a) => catOf(a) === c.id);
            if (list.length === 0) return null;
            return (
              <section key={c.id} data-ach-cat={c.id}>
                <div className="font-head mb-2 text-[9px] uppercase text-[var(--link)]">
                  {c.name[lang]} <span className="text-[var(--muted)]">{list.filter((a) => unlocked[a.id]).length}/{ACHIEVEMENTS.filter((a) => catOf(a) === c.id).length}</span>
                </div>
                <ul className="grid gap-2 md:grid-cols-2">
                  {list.map((a) => {
                    const done = !!unlocked[a.id];
                    const cur = Math.min(prog[a.id] ?? 0, a.max ?? 1);
                    const secret = a.hidden && !done;
                    const color = TIER_COLOR[a.tier];
                    const r = rarity(a.id);
                    return (
                      <li
                        key={a.id}
                        data-ach-id={a.id}
                        data-ach-state={done ? "unlocked" : "locked"}
                        onClick={demo ? () => achActions.preview(a.id) : undefined}
                        title={demo ? T("Click to preview this pop-up", "Нажми, чтобы увидеть это окно") : undefined}
                        className={`flex items-center gap-3 border-2 p-3 ${demo ? "cursor-pointer hover:brightness-125" : ""}`}
                        style={{ borderColor: done ? color : "var(--border)", background: done ? `${color}14` : "rgba(8,10,32,0.55)" }}
                      >
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center border-2 bg-[#0b0a1f]" style={{ borderColor: done ? color : "var(--border)" }}>
                          <AchIcon icon={a.icon} color={color} size={40} locked={!done} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-head block text-[9px] uppercase leading-snug" style={{ color: done ? "var(--text)" : "var(--muted)" }}>
                            {secret ? "???" : a.name[lang]}
                          </span>
                          <span className="mt-0.5 block text-[17px] leading-snug text-[var(--text-2)]">{secret ? T("Hidden achievement. Try poking around.", "Скрытое достижение. Поищи.") : a.desc[lang]}</span>
                          {a.max && a.max > 1 && !secret ? (
                            <span className="mt-1.5 flex items-center gap-2">
                              <span className="h-1.5 w-full max-w-[150px] bg-[var(--border)]">
                                <span className="block h-full" style={{ width: `${((done ? a.max : cur) / a.max) * 100}%`, background: color }} />
                              </span>
                              <span className="font-head text-[7px] text-[var(--muted)]">
                                {done ? a.max : cur}/{a.max}
                              </span>
                            </span>
                          ) : null}
                          <span className="font-head mt-1.5 flex flex-wrap items-center gap-x-3 text-[6px] uppercase" style={{ color }}>
                            <span>{TIER_LABEL[a.tier][lang]} · +{POINTS[a.tier]}</span>
                            {done && <span className="text-[var(--muted)]">{T("unlocked", "получено")} {new Date(unlocked[a.id]).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { month: "short", day: "numeric" })}</span>}
                            {r != null && !secret && (
                              <span className="text-[var(--muted)]" data-rarity>
                                {r}% {a.id === "uplink" || a.id === "anonymous-signal" || a.id === "first-cell" ? T("of people", "людей") : T("of cells", "клеток")}
                                {demo ? " *" : ""}
                              </span>
                            )}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}

        <p className="text-[15px] leading-snug text-[var(--muted)]">
          {demo
            ? T("Demo: the book is simulated and separate from live mode. Click any card to preview its pop-up. * rarity numbers are simulated.", "Демо: список симулированный и отдельный от live. Нажми на любую карточку, чтобы увидеть её окно. * проценты редкости симулированные.")
            : T("Percentages show how many claimed cells (or people) hold an achievement. Ones you earn by exploring are kept in this browser and have no global number.", "Проценты показывают, у какой доли занятых клеток (или людей) есть достижение. Те, что даются за исследование, хранятся в этом браузере и глобальной цифры не имеют.")}
        </p>
        {demo && (
          <button type="button" onClick={() => achActions.reset()} className="font-head text-[7px] uppercase text-[var(--muted)] hover:text-[#ff8a6c]">
            {T("Reset the demo book in this browser", "Сбросить демо-список в этом браузере")}
          </button>
        )}
      </main>
    </div>
  );
}

export default function AchievementsPage() {
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
