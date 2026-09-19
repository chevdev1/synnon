"use client";

import { useEffect, useRef, useState } from "react";
import { useAch } from "@/lib/achStore";
import { COMMANDS, runCommand, type CmdEnv } from "@/lib/commands";
import { useHelp } from "@/lib/help";
import { useLive } from "@/lib/live/context";
import { usePet } from "@/lib/pets";

type Line = { text: string; tone: "ok" | "err" | "info" | "in" };

const TONE: Record<Line["tone"], string> = { ok: "text-[var(--lime)]", err: "text-[#ff8a6c]", info: "text-[var(--text-2)]", in: "text-[var(--link)]" };

// A small command console on the brain stage ( `>_` button, or the ` key ): type a
// command and watch how the brain reacts. Only your own screen changes.
export default function CommandConsole({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { nodes, currentUserNodeId, injectPulse } = useLive();
  const { unlocked } = useAch();
  const { lang } = useHelp();
  const { choose } = usePet();
  const [lines, setLines] = useState<Line[]>([]);
  const [draft, setDraft] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);
  if (!open) return null;

  const env: CmdEnv = {
    nodes,
    myNode: currentUserNodeId,
    unlocked,
    lang,
    inject: injectPulse,
    say: (text, tone = "info") => setLines((l) => [...l.slice(-40), { text, tone }]),
    clear: () => setLines([]),
    setPet: choose,
  };

  function run(line: string) {
    if (!line.trim()) return;
    setLines((l) => [...l.slice(-40), { text: `> ${line}`, tone: "in" }]);
    setHist((h) => [line, ...h].slice(0, 30));
    setHi(-1);
    runCommand(line, env);
  }

  return (
    <div className="fade-in-up absolute inset-x-3 bottom-3 z-20 mx-auto max-w-[560px] border-2 border-[var(--lime)] bg-[#06071a]/95 p-2.5 shadow-[4px_4px_0_rgba(196,242,96,0.25)]" role="dialog" aria-label="Brain console" data-console>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-head text-[7px] uppercase text-[var(--lime)]">{`// ${lang === "ru" ? "консоль мозга" : "brain console"}`}</span>
        <button type="button" onClick={onClose} aria-label="Close console" className="font-head text-[9px] text-[var(--muted)] hover:text-[#ff8a6c]">
          ✕
        </button>
      </div>
      <div ref={logRef} className="max-h-[104px] min-h-[44px] space-y-0.5 overflow-y-auto text-[16px] leading-snug" data-console-log>
        {lines.length === 0 && (
          <div className={TONE.info}>{lang === "ru" ? "Консоль мозга. Нажми на команду ниже или набери /help." : "Brain console. Tap a command below or type /help."}</div>
        )}
        {lines.map((l, i) => (
          <div key={i} className={TONE[l.tone]}>
            {l.text}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {COMMANDS.filter((c) => !c.secret).map((c) => (
          <button key={c.name} type="button" onClick={() => (c.usage ? (setDraft(`/${c.name} `), inputRef.current?.focus()) : run(`/${c.name}`))} className="font-head border border-[var(--border)] px-1.5 py-1 text-[6px] uppercase text-[var(--link)] hover:border-[var(--lime)] hover:text-[var(--lime)]" data-cmd-chip={c.name}>
            /{c.name}
          </button>
        ))}
      </div>
      <form
        className="mt-1.5 flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          run(draft);
          setDraft("");
        }}
      >
        <span className="font-head text-[9px] text-[var(--lime)]">&gt;</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowUp" && hist.length) {
              e.preventDefault();
              const n = Math.min(hi + 1, hist.length - 1);
              setHi(n);
              setDraft(hist[n]);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              const n = hi - 1;
              setHi(n);
              setDraft(n >= 0 ? hist[n] : "");
            }
          }}
          placeholder="/help"
          aria-label="Console command"
          autoComplete="off"
          spellCheck={false}
          maxLength={80}
          className="h-8 min-w-0 flex-1 border-2 border-[var(--border)] bg-transparent px-2 text-[17px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--lime)]"
        />
      </form>
    </div>
  );
}
