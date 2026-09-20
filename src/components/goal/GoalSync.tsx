"use client";

import { useEffect, useRef, useState } from "react";
import { achActions } from "@/lib/achStore";
import { useDemo } from "@/lib/demo";
import { demoGoal, GOAL_TIERS } from "@/lib/goal";
import { goalActions, useGoal } from "@/lib/goalStore";
import { useHelp } from "@/lib/help";
import { notifyActions } from "@/lib/notify";
import { sfx } from "@/lib/sfx";
import { sky, skyActions } from "@/lib/sky";

// Lives in the root layout so it works on every page: keeps the weekly goal up to date
// (the real API, or a simulated week in the demo), turns the goal's tier into sky effects
// for everyone, and announces it when a new tier is reached.
export default function GoalSync() {
  const { on: demo } = useDemo();
  const { goal, tier, forced } = useGoal();
  const { lang } = useHelp();
  const prev = useRef<number | null>(null);
  const [banner, setBanner] = useState<{ tier: number; preview: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (demo) {
        goalActions.set(demoGoal(Date.now()));
        return;
      }
      try {
        const r = await fetch("/api/goal", { cache: "no-store" });
        if (r.ok && !cancelled) goalActions.set(await r.json());
        else if (!cancelled) goalActions.set(null);
      } catch {
        if (!cancelled) goalActions.set(null);
      }
    };
    void load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [demo]);

  useEffect(() => {
    sky.goalTier = tier;
    return () => {
      sky.goalTier = 0;
    };
  }, [tier]);

  const has = goal != null;
  const week = goal?.week;
  useEffect(() => {
    if (!has) return; // the first load of the goal is not a "new tier"
    if (prev.current != null && tier > prev.current) {
      setBanner({ tier, preview: forced });
      if (!forced) {
        const t = GOAL_TIERS[tier - 1];
        notifyActions.push({ kind: "goal", key: `goal-${week}-${tier}`, en: `Community goal ${tier}/3: ${t.name.en}`, ru: `Цель сообщества ${tier}/3: ${t.name.ru}`, href: "/goal" });
      }
    }
    if (tier >= 3 && !forced) achActions.unlock("goal-gold");
    prev.current = tier;
  }, [tier, forced, has, week]);

  useEffect(() => {
    if (!banner) return;
    sfx.achieve(banner.tier >= 3 ? "legend" : "gold");
    skyActions.pulse(1);
    const t = window.setTimeout(() => setBanner(null), banner.tier >= 3 ? 9000 : 6500);
    return () => window.clearTimeout(t);
  }, [banner]);

  if (!banner || !goal) return null;
  const t = GOAL_TIERS[banner.tier - 1];
  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[68] flex justify-center" role="status" aria-live="polite" data-goal-banner>
      <button type="button" onClick={() => setBanner(null)} className="ach-in pointer-events-auto relative w-full max-w-[460px] overflow-hidden border-2 border-[#ffd166] bg-[#080a20] p-3 text-center shadow-[4px_4px_0_rgba(255,209,102,0.3),0_0_26px_rgba(255,209,102,0.25)]">
        <span className="ach-shine pointer-events-none absolute inset-0" style={{ ["--c" as string]: "#ffd166" }} />
        <span className="font-head relative block text-[7px] uppercase text-[#ffd166]">
          {lang === "ru" ? "Цель сообщества" : "Community goal"} {banner.tier}/3{banner.preview ? (lang === "ru" ? " · пример" : " · preview") : ""}
        </span>
        <span className="font-head relative mt-2 block text-[13px] uppercase text-[var(--text)]">{t.name[lang]}</span>
        <span className="relative mt-1.5 block text-[17px] leading-snug text-[var(--text-2)]">{t.desc[lang]}</span>
      </button>
    </div>
  );
}
