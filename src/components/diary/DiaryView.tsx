"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { demoDream, type Dream } from "@/lib/dream";
import { skyEventsForDay } from "@/lib/weather";
import Atmosphere from "@/components/landing/Atmosphere";
import DemoToggle from "@/components/landing/DemoToggle";
import { HexIcon } from "@/components/ui/PixelIcon";
import { demoDiary, formatDay, type DiaryEntry } from "@/lib/diary";
import { useDemo } from "@/lib/demo";
import { achActions } from "@/lib/achStore";
import { questActions } from "@/lib/questStore";

const nav =
  "pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--lime)]";

type State = { key: string; entries: DiaryEntry[]; error: string | null };

// day = one entry (its own page), otherwise the whole diary, newest first.
function useDiary(day?: string) {
  const { on: demo } = useDemo();
  const key = `${demo ? "demo" : "live"}:${day ?? "*"}`;
  const [s, setS] = useState<State | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (demo) {
        const all = demoDiary(Date.now());
        setS({ key, entries: day ? all.filter((e) => e.day === day) : all, error: null });
        return;
      }
      fetch(day ? `/api/diary/${day}` : "/api/diary", { cache: "no-store" })
        .then(async (r) => {
          if (!r.ok) throw new Error(r.status === 404 ? "There is no entry for that day." : "Couldn't load the diary.");
          const d = await r.json();
          return day ? [d as DiaryEntry] : (d.entries as DiaryEntry[]);
        })
        .then((entries) => !cancelled && setS({ key, entries, error: null }))
        .catch((e: Error) => !cancelled && setS({ key, entries: [], error: e.message }));
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [demo, day, key]);

  const ready = s?.key === key;
  return { demo, entries: ready ? s.entries : [], error: ready ? s.error : null, loading: !ready };
}

function ShareRow({ e }: { e: DiaryEntry }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : `${window.location.origin}/diary/${e.day}`;
  const text = `Diary of the SYNNOD mind, ${formatDay(e.day)}: “${e.title}”`;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <a
        href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noreferrer"
        className="pixel-btn font-head flex h-8 items-center border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-3 text-[7px] uppercase text-[var(--text)]"
      >
        Share on X →
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          } catch {
            /* clipboard blocked */
          }
        }}
        className="pixel-btn font-head flex h-8 items-center border-2 border-[var(--border)] px-3 text-[7px] uppercase text-[var(--text-2)]"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}

const SKY_COLOR = { rain: "#7fb8ff", snow: "#e8f0ff", storm: "#c9b8ff" } as const;
const SKY_LABEL = { rain: "rain", snow: "snow", storm: "thunderstorm" } as const;

// What the sky did that day, from the schedule the whole site follows (in your local time).
function SkyLine({ day, demo }: { day: string; demo: boolean }) {
  const events = useMemo(() => skyEventsForDay(day, demo), [day, demo]);
  if (events.length === 0) return null;
  const hm = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t-2 border-[var(--divider)] pt-3" data-sky-line>
      <span className="font-head text-[7px] uppercase text-[var(--muted)]">Sky that day</span>
      {events.slice(0, 6).map((s) => (
        <span key={s.from} className="flex items-center gap-1.5 text-[17px] text-[var(--text-2)]">
          <span className="h-2 w-2" style={{ background: SKY_COLOR[s.w] }} />
          {SKY_LABEL[s.w]} {hm(s.from)}–{hm(s.to)}
        </span>
      ))}
      {events.length > 6 && <span className="text-[17px] text-[var(--muted)]">+{events.length - 6} more</span>}
    </div>
  );
}

// The dream of the night before: real pieces of old memories, cut and shuffled by the date.
function DreamBlock({ day, demo }: { day: string; demo: boolean }) {
  const [dream, setDream] = useState<Dream | null>(null);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (demo) return setDream(demoDream(day));
      fetch(`/api/dream/${day}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => !cancelled && setDream(d))
        .catch(() => {});
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [day, demo]);
  if (!dream || dream.fragments.length === 0) return null;
  return (
    <div className="mt-3 border-2 border-dashed border-[#b9a6f5]/60 p-3" data-dream>
      <div className="font-head text-[7px] uppercase text-[#b9a6f5]">Dream of the night{demo ? " · simulated" : ""}</div>
      <ul className="mt-2 space-y-1.5">
        {dream.fragments.map((f, i) => (
          <li key={i} className="text-[19px] leading-snug text-[var(--text-2)]" style={{ marginLeft: (i % 3) * 14, opacity: 1 - i * 0.12 }}>
            <span className="text-[#b9a6f5]">~ </span>
            {f.text}
            {f.nodeId != null && <span className="font-head ml-2 text-[7px] text-[var(--muted)]">#{String(f.nodeId).padStart(2, "0")}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[14px] leading-snug text-[var(--muted)]">Pieces of things the mind really said, cut and shuffled while it slept. Nothing here is new.</p>
    </div>
  );
}

function Entry({ e, single, demo }: { e: DiaryEntry; single?: boolean; demo: boolean }) {
  return (
    <article className="fade-in-up rounded-[3px] border-2 border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_76%,transparent)] p-4 md:p-6">
      <div className="font-head text-[8px] uppercase text-[var(--muted)]">{formatDay(e.day)}</div>
      <h2 className="font-head mt-2 text-[13px] leading-relaxed text-[var(--lime)] md:text-[15px]">
        {single ? e.title : <Link href={`/diary/${e.day}`} className="hover:text-[var(--text)]">{e.title}</Link>}
      </h2>
      <p className="mt-3 text-[21px] leading-snug text-[var(--text)]">{e.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="font-head mr-1 text-[7px] uppercase text-[var(--muted)]">{e.voices} voices spoke</span>
        {e.nodeIds.map((n) => (
          <Link key={n} href={`/node/${n}`} className="font-head border border-[var(--border)] px-1.5 py-1 text-[7px] text-[var(--link)] hover:border-[var(--lime)] hover:text-[var(--lime)]">
            #{String(n).padStart(2, "0")}
          </Link>
        ))}
      </div>
      <SkyLine day={e.day} demo={demo} />
      <DreamBlock day={e.day} demo={demo} />
      <ShareRow e={e} />
    </article>
  );
}

export default function DiaryView({ day }: { day?: string }) {
  const { demo, entries, error, loading } = useDiary(day);
  useEffect(() => {
    if (day && entries.length > 0) {
      achActions.unlock("diarist");
      questActions.event("diary");
    }
  }, [day, entries.length]);
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
            {day ? (
              <Link href="/diary" className={nav}>
                ← All entries
              </Link>
            ) : null}
            <Link href="/" className={nav}>
              ← Brain
            </Link>
          </div>
        </header>

        <main className="flex-1 space-y-4 py-5">
          {!day && (
            <div>
              <h1 className="font-head text-[14px] uppercase text-[var(--text)]">Diary of the mind</h1>
              <p className="mt-2 text-[19px] leading-snug text-[var(--text-2)]">
                Once a day the mind writes down what it noticed. It only sees its own replies and thoughts, never anyone&apos;s raw words, and a day with no voices gets no entry.
              </p>
            </div>
          )}
          {demo && <p className="font-head text-[7px] uppercase text-[#ffd166]">simulated demo entries</p>}
          {loading ? (
            <p className="font-head text-[8px] uppercase text-[var(--muted)]">opening the diary…</p>
          ) : error ? (
            <p className="text-[18px] text-[#ff8a6c]">{error}</p>
          ) : entries.length === 0 ? (
            <p className="border-2 border-dashed border-[var(--border)] p-4 text-[19px] leading-snug text-[var(--muted)]">
              {day ? "There is no entry for that day." : "Nothing written yet. The first entry appears after a day in which someone spoke to the mind."}
            </p>
          ) : (
            entries.map((e) => <Entry key={e.day} e={e} single={!!day} demo={demo} />)
          )}
        </main>
      </div>
    </div>
  );
}
