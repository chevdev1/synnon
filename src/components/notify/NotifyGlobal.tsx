"use client";

import { useEffect } from "react";
import { notifyActions } from "@/lib/notify";
import { weekId } from "@/lib/question";
import { dayKey } from "@/lib/quests";
import { currentStreak, streakCountedToday } from "@/lib/questStore";

// Notifications that need no live data: the new question of the week (on the first visit
// after Monday) and a streak that is about to end tonight. Mounted once in the layout.
const SEEN_KEY = "synnod-question-seen";

export default function NotifyGlobal() {
  useEffect(() => {
    try {
      const wk = weekId();
      const seen = window.localStorage.getItem(SEEN_KEY);
      if (seen && seen !== wk) {
        notifyActions.push({ kind: "question", key: `question-${wk}`, en: "A new question of the week is waiting for your answer.", ru: "Новый вопрос недели ждёт твоего ответа.", href: "/question" });
      }
      window.localStorage.setItem(SEEN_KEY, wk);
    } catch {
      /* storage blocked */
    }
    const check = () => {
      // the streak is alive only because of yesterday, it is evening and nothing was done today
      const n = currentStreak();
      if (n > 0 && new Date().getHours() >= 19 && !streakCountedToday()) {
        notifyActions.push({ kind: "streak", key: `streak-${dayKey()}`, en: `Your ${n}-day streak ends tonight. One quest keeps it.`, ru: `Твоя серия из ${n} дн. закончится сегодня ночью. Одно задание сохранит её.`, href: "/daily" });
      }
    };
    const first = window.setTimeout(check, 4000);
    const id = window.setInterval(check, 5 * 60_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return null;
}
