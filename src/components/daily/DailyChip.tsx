"use client";

import Link from "next/link";
import AchIcon from "@/components/achievements/AchIcon";
import { dayKey, questsForDay } from "@/lib/quests";
import { streakOf, useQuestBook } from "@/lib/questStore";

// Header chip: the flame is lit while you have a streak; "n/3" is today's quests done.
export default function DailyChip() {
  const book = useQuestBook();
  const today = dayKey();
  const quests = questsForDay(today);
  const done = quests.filter((q) => book.days[today]?.d.includes(q.id)).length;
  const streak = streakOf(book, today);
  const color = streak > 0 ? "#ff8a4c" : "#7a82a8";
  return (
    <Link
      href="/daily"
      data-help-id="daily"
      data-daily-chip
      aria-label={`Daily quests: ${done} of ${quests.length} done, ${streak}-day streak`}
      className="pixel-btn font-head flex h-11 items-center gap-2 border-2 px-3 text-[8px] uppercase sm:h-9"
      style={{ borderColor: color, color }}
    >
      <AchIcon icon="flame" color={color} size={16} />
      {streak}d
      <span className="text-[var(--muted)]">
        {done}/{quests.length}
      </span>
    </Link>
  );
}
