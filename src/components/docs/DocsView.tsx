"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HexIcon } from "@/components/ui/PixelIcon";
import { DOCS, DOCS_UI, type Block } from "@/lib/docsContent";
import { helpActions, useHelp, type Lang } from "@/lib/help";

function BlockView({ b, L }: { b: Block; L: Lang }) {
  switch (b.kind) {
    case "p":
      return <p className="text-[20px] leading-snug text-[var(--text-2)]">{b.text[L]}</p>;
    case "list":
      return (
        <ul className="space-y-2">
          {b.items.map((it, i) => (
            <li key={i} className="flex items-start gap-3 text-[20px] leading-snug text-[var(--text-2)]">
              <span className="mt-[9px] h-2 w-2 shrink-0 bg-[var(--cell-pink)]" />
              <span>{it[L]}</span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="grid gap-3 md:grid-cols-3">
          {b.items.map((s, i) => (
            <li key={i} className="border-2 border-[var(--border)] bg-[#0b0a1f] p-3">
              <div className="font-head text-[9px] uppercase leading-relaxed text-[var(--lime)]">{s.title[L]}</div>
              <p className="mt-2 text-[18px] leading-snug text-[var(--text-2)]">{s.text[L]}</p>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto border-2 border-[var(--border)]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0b0a1f]">
                {b.head.map((h, i) => (
                  <th key={i} className="font-head border-b-2 border-[var(--border)] px-3 py-2 text-[8px] uppercase text-[var(--muted)]">
                    {h[L]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-b border-[var(--divider)] last:border-b-0">
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-2 align-top text-[19px] leading-snug ${j === 0 ? "font-head w-[26%] text-[9px] uppercase text-[var(--lime)]" : "text-[var(--text-2)]"}`}>
                      {c[L]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "note":
      return (
        <div className={`border-2 p-3 text-[19px] leading-snug ${b.tone === "warn" ? "border-[#ff8a6c] text-[#ffb4a0]" : "border-[var(--accent)] text-[var(--text)]"} bg-[#0b0a1f]`}>
          <span className={`font-head mr-2 text-[8px] uppercase ${b.tone === "warn" ? "text-[#ff8a6c]" : "text-[var(--link)]"}`}>{b.tone === "warn" ? "!" : "i"}</span>
          {b.text[L]}
        </div>
      );
    case "faq":
      return (
        <div className="space-y-2">
          {b.items.map((f, i) => (
            <details key={i} className="group border-2 border-[var(--border)] bg-[#0b0a1f] open:border-[var(--accent)]">
              <summary className="flex list-none items-center justify-between gap-3 px-3 py-2 text-[20px] text-[var(--text)] [&::-webkit-details-marker]:hidden">
                {f.q[L]}
                <span className="font-head text-[10px] text-[var(--lime)] group-open:rotate-45">+</span>
              </summary>
              <p className="border-t border-[var(--divider)] px-3 py-2 text-[19px] leading-snug text-[var(--text-2)]">{f.a[L]}</p>
            </details>
          ))}
        </div>
      );
    case "links":
      return (
        <div className="flex flex-wrap gap-2">
          {b.items.map((l, i) => (
            <a
              key={i}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="pixel-btn font-head border-2 border-[var(--accent)] px-3 py-2 text-[8px] uppercase leading-relaxed text-[var(--link)]"
            >
              {l.label[L]} ↗
            </a>
          ))}
        </div>
      );
  }
}

export default function DocsView() {
  const h = useHelp();
  const L = h.lang;
  const [active, setActive] = useState(DOCS[0].id);

  // Highlight the section currently in view in the table of contents.
  useEffect(() => {
    const els = DOCS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--divider)] py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="drop-shadow-[0_0_6px_rgba(196,242,96,0.55)]">
            <HexIcon size={24} />
          </span>
          <span className="font-head text-[12px] tracking-[0.35em] text-[var(--text)]">SYNNOD</span>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-head flex text-[8px] uppercase">
            {(["ru", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => helpActions.setLang(l)}
                aria-pressed={L === l}
                className={`h-8 border-2 px-2.5 ${L === l ? "border-[var(--link)] bg-[var(--link)] text-[#06071a]" : "border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`}
              >
                {l}
              </button>
            ))}
          </span>
          <Link href="/" className="pixel-btn font-head flex h-8 items-center border-2 border-[var(--lime)] px-3 text-[8px] uppercase text-[var(--lime)]">
            {DOCS_UI.back[L]}
          </Link>
        </div>
      </header>

      <div className="mt-8">
        <h1 className="font-head text-[18px] uppercase leading-relaxed text-[var(--text)] sm:text-[22px]">{DOCS_UI.title[L]}</h1>
        <p className="mt-3 text-[21px] text-[var(--text-2)]">{DOCS_UI.subtitle[L]}</p>
        <p className="mt-1 text-[17px] text-[var(--muted)]">{DOCS_UI.updated[L]}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr]">
        <nav aria-label={DOCS_UI.toc[L]} className="lg:sticky lg:top-6 lg:self-start">
          <div className="font-head mb-3 text-[8px] uppercase text-[var(--muted)]">{DOCS_UI.toc[L]}</div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:block lg:space-y-1">
            {DOCS.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`flex items-start gap-2 py-1 text-[19px] leading-tight transition-colors ${active === s.id ? "text-[var(--lime)]" : "text-[var(--text-2)] hover:text-[var(--text)]"}`}
                >
                  <span className="font-head mt-[3px] w-5 shrink-0 text-[8px] text-[var(--faint)]">{String(i + 1).padStart(2, "0")}</span>
                  {s.title[L]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="space-y-6">
          {DOCS.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-6 border-2 border-[var(--border)] bg-[var(--panel)] p-5">
              <h2 className="font-head flex items-baseline gap-3 text-[12px] uppercase leading-relaxed text-[var(--text)]">
                <span className="text-[var(--lime)]">{String(i + 1).padStart(2, "0")}</span>
                {s.title[L]}
              </h2>
              <div className="mt-4 space-y-4">
                {s.blocks.map((b, j) => (
                  <BlockView key={j} b={b} L={L} />
                ))}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
