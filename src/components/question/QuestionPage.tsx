"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Atmosphere from "@/components/landing/Atmosphere";
import DemoToggle from "@/components/landing/DemoToggle";
import { HexIcon } from "@/components/ui/PixelIcon";
import { achActions } from "@/lib/achStore";
import { useHelp } from "@/lib/help";
import { LiveRoot } from "@/lib/live/LiveRoot";
import { useLive } from "@/lib/live/context";
import { demoQuestion, MAX_ANSWER, type QState } from "@/lib/question";
import { sfx } from "@/lib/sfx";
import AnswerMosaic, { colorOf } from "./AnswerMosaic";

const nav =
  "pixel-btn font-head flex h-9 items-center border-2 border-[var(--border)] px-3 text-[8px] uppercase text-[var(--text-2)] hover:border-[var(--accent)] hover:text-[var(--lime)]";

// Demo: a simulated week, held in memory. Live: the real API.
function useQuestion() {
  const { mode, nodes, currentUserNodeId } = useLive();
  const [state, setState] = useState<QState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cellIds = nodes.map((n) => n.id).join(",");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/question", { cache: "no-store" });
      if (!r.ok) throw new Error("The question isn't available right now.");
      setState((await r.json()) as QState);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (mode === "demo") {
      const ids = cellIds ? cellIds.split(",").map(Number) : [];
      const t = setTimeout(() => setState(demoQuestion(Date.now(), ids)), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [mode, cellIds, load]);

  async function submit(text: string): Promise<{ ok: boolean; msg: string }> {
    if (mode === "demo") {
      const id = currentUserNodeId ?? 7;
      setState((s) => (s ? { ...s, mine: { status: "approved" }, answers: [{ id: Date.now(), nodeId: id, text: text.trim(), ts: Date.now() }, ...s.answers.filter((a) => a.nodeId !== id)] } : s));
      achActions.unlock("answered-mind");
      return { ok: true, msg: "Added to the simulated mosaic (nothing is saved in the demo)." };
    }
    try {
      const r = await fetch("/api/question/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
      const d = (await r.json().catch(() => ({}))) as { status?: string; error?: string };
      if (!r.ok && r.status !== 202) return { ok: false, msg: d.error ?? "Couldn't send that." };
      achActions.unlock("answered-mind");
      await load();
      return { ok: true, msg: d.status === "approved" ? "Your cell lit up in the mosaic." : "Saved. It shows up in the mosaic once it has been reviewed." };
    } catch {
      return { ok: false, msg: "Network error. Try again." };
    }
  }
  return { state, error, submit, mode };
}

function Body() {
  const { me, currentUserNodeId } = useLive();
  const { lang } = useHelp();
  const { state, error, submit, mode } = useQuestion();
  const [picked, setPicked] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; msg: string } | null>(null);
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);

  const answers = state?.answers ?? [];
  const shownNode = picked ?? answers[0]?.nodeId ?? null;
  const shown = answers.find((a) => a.nodeId === shownNode) ?? null;
  const canAnswer = !!me && currentUserNodeId != null;
  const mine = state?.mine ?? null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (draft.trim().length < 2 || busy) return;
    setBusy(true);
    const r = await submit(draft);
    setBusy(false);
    setNote(r);
    if (r.ok) {
      setDraft("");
      sfx.found();
      if (currentUserNodeId != null) setPicked(currentUserNodeId);
    }
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
          <Link href="/mind" className={nav}>
            {T("The mind", "Разум")}
          </Link>
          <Link href="/" className={nav}>
            ← Brain
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-5 py-5">
        {error ? (
          <p className="text-[18px] text-[#ff8a6c]">{error}</p>
        ) : !state ? (
          <p className="font-head text-[8px] uppercase text-[var(--muted)]">{T("the mind is thinking of a question…", "разум придумывает вопрос…")}</p>
        ) : (
          <>
            <section>
              <div className="font-head flex flex-wrap items-center gap-x-3 text-[8px] uppercase text-[var(--muted)]">
                <span>{T("Question of the week", "Вопрос недели")}</span>
                <span className="text-[#ffd166]">{state.question.week}</span>
                {mode === "demo" && <span className="text-[#ffd166]">· {T("simulated demo week", "симулированная неделя демо")}</span>}
              </div>
              <h1 className="mt-2 text-[30px] leading-tight text-[var(--lime)] sm:text-[38px]" data-question-text>
                {state.question.text}
              </h1>
              <p className="mt-1 text-[16px] text-[var(--muted)]">
                {state.question.source === "mind" ? T("The mind asked this itself.", "Этот вопрос разум задал сам.") : T("Picked from the project's list of questions (the mind couldn't think of one).", "Выбран из списка вопросов проекта (разум не смог придумать свой).")}
              </p>
            </section>

            <section className="border-2 border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_76%,transparent)] p-3 md:p-4" data-answer-form>
              {mine ? (
                <p className="text-[18px] text-[var(--lime)]">
                  {mine.status === "approved" ? T("Your cell has answered. It is lit up in the mosaic below.", "Твоя клетка ответила и светится в мозаике ниже.") : T("Your answer is saved and will appear once it has been reviewed.", "Твой ответ сохранён и появится после проверки.")}
                </p>
              ) : !canAnswer ? (
                <p className="text-[18px] leading-snug text-[var(--text-2)]">
                  {T("Only cells can answer. Claim a cell on the brain first, then come back and light yours up.", "Отвечать могут только клетки. Сначала займи клетку на мозге, потом вернись и зажги свою.")}{" "}
                  <Link href="/" className="text-[var(--link)] underline hover:text-[var(--lime)]">
                    {T("Go to the brain →", "К мозгу →")}
                  </Link>
                </p>
              ) : (
                <form onSubmit={send} className="space-y-2">
                  <label className="font-head block text-[8px] uppercase text-[var(--muted)]" htmlFor="qa">
                    {T("Your answer (short, no names, no links)", "Твой ответ (коротко, без имён и ссылок)")}
                  </label>
                  <textarea
                    id="qa"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    maxLength={MAX_ANSWER}
                    rows={2}
                    className="w-full resize-none border-2 border-[var(--border)] bg-transparent p-2 text-[19px] leading-snug text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--lime)]"
                    placeholder={T("the fridge humming at 3 a.m.", "холодильник, гудящий в три ночи")}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[15px] text-[var(--muted)]">
                      {draft.length}/{MAX_ANSWER}
                    </span>
                    <button type="submit" disabled={busy || draft.trim().length < 2} className="pixel-btn font-head h-9 border-2 border-[var(--accent)] bg-[var(--accent)]/10 px-4 text-[8px] uppercase text-[var(--text)] disabled:opacity-50" data-answer-send>
                      {busy ? T("Sending…", "Отправка…") : T("Light up my cell →", "Зажечь мою клетку →")}
                    </button>
                  </div>
                </form>
              )}
              {note && <p className={`mt-2 text-[16px] ${note.ok ? "text-[var(--lime)]" : "text-[#ff8a6c]"}`}>{note.msg}</p>}
            </section>

            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-head text-[9px] uppercase text-[var(--text)]">{T("Mosaic of answers", "Мозаика ответов")}</div>
                <span className="text-[17px] text-[var(--text-2)]" data-mosaic-count>
                  {T(`${answers.length} of ${state.cells} voices answered`, `ответили ${answers.length} из ${state.cells} голосов`)}
                </span>
              </div>
              <div className="mt-2 border-2 border-[var(--border)] bg-[color-mix(in_srgb,var(--panel)_76%,transparent)] p-3">
                <AnswerMosaic answers={answers} selected={shownNode} mineId={currentUserNodeId} onPick={setPicked} />
                <div className="mx-auto mt-3 min-h-[68px] max-w-[560px] border-t-2 border-[var(--divider)] pt-3" data-mosaic-shown>
                  {shown ? (
                    <>
                      <span className="font-head text-[8px] uppercase" style={{ color: colorOf(shown.nodeId) }}>
                        {T("Cell", "Клетка")} {String(shown.nodeId).padStart(2, "0")}
                      </span>
                      <p className="mt-1 text-[21px] leading-snug text-[var(--text)]">“{shown.text}”</p>
                    </>
                  ) : (
                    <p className="text-[17px] text-[var(--muted)]">{T("No answers yet. The first one lights the first tile.", "Ответов пока нет. Первый зажжёт первую плитку.")}</p>
                  )}
                </div>
              </div>
            </section>

            {state.synthesis && (
              <section className="border-2 border-[var(--accent)] bg-[#0b0a1f]/80 p-4" data-synthesis>
                <div className="font-head text-[8px] uppercase text-[var(--link)]">{T("What the mind heard", "Что услышал разум")}</div>
                <p className="mt-2 text-[21px] leading-snug text-[var(--text)]">{state.synthesis}</p>
                <p className="mt-2 text-[15px] text-[var(--muted)]">{mode === "demo" ? T("Simulated in the demo.", "Симулировано в демо.") : T("Written by the mind from the approved answers. It never names or quotes anyone.", "Написано разумом по одобренным ответам. Он никого не называет и не цитирует.")}</p>
              </section>
            )}

            {answers.length > 0 && (
              <section>
                <div className="font-head mb-2 text-[9px] uppercase text-[var(--text)]">{T("All answers", "Все ответы")}</div>
                <ul className="grid gap-2 sm:grid-cols-2" data-answer-list>
                  {answers.map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => setPicked(a.nodeId)} className="w-full border-2 p-2 text-left" style={{ borderColor: a.nodeId === shownNode ? colorOf(a.nodeId) : "var(--border)", background: a.nodeId === shownNode ? `${colorOf(a.nodeId)}14` : "rgba(8,10,32,0.55)" }}>
                        <span className="font-head text-[7px] uppercase" style={{ color: colorOf(a.nodeId) }}>
                          {String(a.nodeId).padStart(2, "0")}
                        </span>
                        <span className="mt-1 block text-[18px] leading-snug text-[var(--text-2)]">{a.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function QuestionPage() {
  return (
    <LiveRoot>
      <div className="relative min-h-dvh bg-[var(--bg)]">
        <Atmosphere />
        <Body />
      </div>
    </LiveRoot>
  );
}
