"use client";

import Link from "next/link";
import { GOAL_TIERS } from "@/lib/goal";
import { useGoal } from "@/lib/goalStore";
import { useHelp } from "@/lib/help";

// Compact weekly-goal bar (left card): three milestones, lit as the community reaches them.
export default function GoalBar() {
  const { goal, tier, pct } = useGoal();
  const { lang } = useHelp();
  if (!goal) return null;
  const next = GOAL_TIERS[tier] ?? null;
  const need = next ? Math.max(0, Math.ceil(goal.target * next.at) - goal.count) : 0;
  return (
    <Link href="/goal" data-help-id="goal" data-goal-bar className="mt-3 block border-2 border-[var(--border)] p-2 transition-colors hover:border-[#ffd166]">
      <div className="font-head flex items-center justify-between text-[7px] uppercase">
        <span className="text-[#ffd166]">{lang === "ru" ? "Цель недели" : "Weekly goal"}</span>
        <span className="text-[var(--text)]" data-goal-count>
          {goal.count}/{goal.target}
        </span>
      </div>
      <div className="relative mt-1.5 h-2 w-full bg-[var(--border)]">
        <div className="h-full bg-[#ffd166]" style={{ width: `${pct * 100}%` }} />
        {GOAL_TIERS.map((t, i) => (
          <span key={i} className="absolute top-[-2px] h-3 w-[2px]" style={{ left: `calc(${t.at * 100}% - 1px)`, background: tier > i ? "#fff" : "#4d5680" }} />
        ))}
      </div>
      <div className="mt-1 text-[14px] leading-snug text-[var(--muted)]">
        {next ? (lang === "ru" ? `ещё ${need} голосов до «${next.name.ru}»` : `${need} more voices to ${next.name.en}`) : lang === "ru" ? "Золотое небо! Цель выполнена." : "Golden sky! Goal reached."}
      </div>
    </Link>
  );
}
