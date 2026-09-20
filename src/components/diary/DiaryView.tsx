"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

function Entry({ e, single }: { e: DiaryEntry; single?: boolean }) {
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
            entries.map((e) => <Entry key={e.day} e={e} single={!!day} />)
          )}
        </main>
      </div>
    </div>
  );
}
