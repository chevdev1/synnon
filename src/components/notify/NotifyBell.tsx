"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDemo } from "@/lib/demo";
import { useHelp } from "@/lib/help";
import { notifyActions, useNotes, type NoteKind } from "@/lib/notify";

const KIND: Record<NoteKind, { color: string; label: { en: string; ru: string } }> = {
  resonance: { color: "#ffd166", label: { en: "Resonance", ru: "Резонанс" } },
  thought: { color: "#c4f260", label: { en: "Thought", ru: "Мысль" } },
  question: { color: "#7fd6ff", label: { en: "Question", ru: "Вопрос" } },
  goal: { color: "#ffd166", label: { en: "Goal", ru: "Цель" } },
  pet: { color: "#ff9be0", label: { en: "Companion", ru: "Спутник" } },
  streak: { color: "#ff8a4c", label: { en: "Streak", ru: "Серия" } },
};

// 8x8 pixel bell
const BELL = ["...##...", "..####..", "..####..", ".######.", ".######.", "########", "........", "...##..."];

function ago(ts: number, lang: "en" | "ru") {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return lang === "ru" ? "только что" : "just now";
  if (m < 60) return lang === "ru" ? `${m} мин назад` : `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return lang === "ru" ? `${h} ч назад` : `${h}h ago`;
  return lang === "ru" ? `${Math.round(h / 24)} дн назад` : `${Math.round(h / 24)}d ago`;
}

export default function NotifyBell() {
  const { notes, alerts, supported } = useNotes();
  const { on: demo } = useDemo();
  const { lang } = useHelp();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 12, top: 60 });
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const unread = notes.filter((n) => !n.read).length;

  useEffect(() => {
    notifyActions.setMode(demo ? "demo" : "live");
  }, [demo]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);

  function toggle() {
    if (!open && btn.current) {
      const r = btn.current.getBoundingClientRect();
      const w = Math.min(340, window.innerWidth - 24);
      setPos({ left: Math.max(12, Math.min(r.right - w, window.innerWidth - w - 12)), top: r.bottom + 8 });
    }
    setOpen((o) => !o);
  }

  const panelEl = open && (
    <div
      ref={panel}
      role="dialog"
      aria-label={T("Notifications", "Уведомления")}
      data-notify-panel
      className="fixed z-[70] border-2 border-[var(--accent)] bg-[#080a20] p-3 shadow-[5px_5px_0_rgba(0,0,0,0.5)]"
      style={{ left: pos.left, top: pos.top, width: Math.min(340, typeof window === "undefined" ? 340 : window.innerWidth - 24), maxHeight: "min(70dvh, 460px)", overflowY: "auto" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-head text-[8px] uppercase text-[var(--text)]">{T("Notifications", "Уведомления")}</span>
        <span className="flex gap-3">
          {unread > 0 && (
            <button type="button" onClick={() => notifyActions.markAllRead()} className="font-head text-[6px] uppercase text-[var(--link)] hover:text-[var(--lime)]" data-notify-read>
              {T("mark read", "прочитано")}
            </button>
          )}
          {notes.length > 0 && (
            <button type="button" onClick={() => notifyActions.clear()} className="font-head text-[6px] uppercase text-[var(--muted)] hover:text-[#ff8a6c]">
              {T("clear", "очистить")}
            </button>
          )}
        </span>
      </div>
      {notes.length === 0 ? (
        <p className="mt-3 text-[17px] leading-snug text-[var(--muted)]">
          {T(
            "Nothing yet. You will hear about a resonance with your cell, a thought grown from your words, the new question, goal milestones and your companion growing up.",
            "Пока пусто. Здесь появятся резонанс с твоей клеткой, мысль, выросшая из твоих слов, новый вопрос, ступени цели и рост твоего спутника.",
          )}
        </p>
      ) : (
        <ul className="mt-2 space-y-1.5" data-notify-list>
          {notes.map((n) => {
            const k = KIND[n.kind];
            const body = (
              <>
                <span className="font-head block text-[6px] uppercase" style={{ color: k.color }}>
                  {k.label[lang]} · {ago(n.ts, lang)}
                </span>
                <span className="mt-0.5 block text-[17px] leading-snug text-[var(--text-2)]">{lang === "ru" ? n.ru : n.en}</span>
              </>
            );
            return (
              <li key={n.id} className="border-l-2 py-1 pl-2" style={{ borderColor: n.read ? "var(--border)" : k.color, opacity: n.read ? 0.7 : 1 }}>
                {n.href ? (
                  <Link href={n.href} onClick={() => setOpen(false)} className="block hover:brightness-125">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3 border-t-2 border-[var(--divider)] pt-2">
        {supported ? (
          <button
            type="button"
            data-notify-alerts
            onClick={() => (alerts ? notifyActions.disableAlerts() : void notifyActions.enableAlerts())}
            className="pixel-btn font-head flex h-8 w-full items-center justify-center border-2 px-2 text-[7px] uppercase"
            style={{ borderColor: alerts ? "var(--lime)" : "var(--accent)", color: alerts ? "var(--lime)" : "var(--link)" }}
          >
            {alerts ? T("Browser alerts: on", "Оповещения браузера: вкл") : T("Turn on browser alerts", "Включить оповещения браузера")}
          </button>
        ) : null}
        <p className="mt-1.5 text-[14px] leading-snug text-[var(--muted)]">
          {T("Alerts appear while SYNNOD is open in a tab. Nothing is sent when the site is closed.", "Оповещения приходят, пока SYNNOD открыт во вкладке. Когда сайт закрыт, ничего не отправляется.")}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={toggle}
        data-help-id="notify"
        data-notify-btn
        aria-expanded={open}
        aria-label={T("Notifications", "Уведомления")}
        className="pixel-btn relative flex h-7 items-center border-2 bg-[#080a20]/85 px-2"
        style={{ borderColor: unread ? "#ffd166" : "var(--accent)" }}
      >
        <svg width={14} height={14} viewBox="0 0 8 8" shapeRendering="crispEdges" fill={unread ? "#ffd166" : "var(--link)"} aria-hidden>
          {BELL.flatMap((row, y) => [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
        </svg>
        {unread > 0 && (
          <span className="font-head absolute -right-1.5 -top-2 min-w-[14px] bg-[#ffd166] px-1 text-center text-[7px] leading-[14px] text-[#06071a]" data-notify-count>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {panelEl && createPortal(panelEl, document.body)}
    </>
  );
}
