import { weekId } from "@/lib/question";

// The weekly community goal: every voice told through a cell (approved scenarios) and
// every approved answer to the weekly question counts as one. Three milestones, and each
// one changes the sky for EVERYONE until the week ends and the counter starts over.
type T = { en: string; ru: string };

export interface GoalState {
  week: string;
  count: number; // voices this week
  target: number;
  contributors: number; // distinct cells that took part
  endsAt: number; // ms, when the week resets (Monday 00:00 UTC)
  source: "live" | "demo";
}

export const GOAL_TIERS: { at: number; name: T; desc: T }[] = [
  { at: 0.33, name: { en: "Falling stars", ru: "Звездопад" }, desc: { en: "Shooting stars streak across the sky far more often.", ru: "Падающие звёзды пролетают по небу гораздо чаще." } },
  { at: 0.66, name: { en: "Aurora", ru: "Сияние" }, desc: { en: "Ribbons of aurora ripple across the sky on every page.", ru: "По небу на каждой странице переливаются ленты сияния." } },
  { at: 1, name: { en: "Golden sky", ru: "Золотое небо" }, desc: { en: "The stars turn gold. The whole community did this together.", ru: "Звёзды становятся золотыми. Это сделало всё сообщество вместе." } },
];

export function tierOf(count: number, target: number): number {
  const f = target > 0 ? count / target : 0;
  let t = 0;
  GOAL_TIERS.forEach((x, i) => {
    if (f >= x.at) t = i + 1;
  });
  return t;
}

// About four voices per claimed cell per week, never absurdly small or large.
export const goalTarget = (taken: number) => Math.max(40, Math.min(600, Math.round(taken * 4)));

// Monday 00:00 UTC of the current ISO week, and the next one.
export function weekBounds(d = new Date()): { start: Date; end: Date } {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() - (day - 1));
  return { start: t, end: new Date(t.getTime() + 7 * 86_400_000) };
}

// A simulated week for the demo (clearly labelled where it is shown).
export function demoGoal(now: number): GoalState {
  return { week: weekId(new Date(now)), count: 62, target: 120, contributors: 31, endsAt: weekBounds(new Date(now)).end.getTime(), source: "demo" };
}
