"use client";

import { useCallback, useSyncExternalStore } from "react";

// Companions: a tiny pixel creature that keeps your cell company on the brain.
// Three are free; three are earned through achievements (so they double as a
// reason to go and find those). The choice lives in this browser.
type T = { en: string; ru: string };

export interface Pet {
  id: string;
  name: T;
  color: string;
  rows: string[]; // 7x7 bitmap: # main colour, o light, x dark (the eye)
  needs?: string; // achievement id that unlocks it
  hint?: T; // shown while locked
  perk: { name: T; desc: T }; // every companion brings one small trick
}

export const PETS: Pet[] = [
  { id: "firefly", name: { en: "Firefly", ru: "Светлячок" }, color: "#c4f260", rows: [".o...o.", "..o.o..", "...#...", "..###..", "..#x#..", "...#...", "...o..."], perk: { name: { en: "Night Light", ru: "Ночник" }, desc: { en: "Wraps your cell in a warm glow, brightest while the mind sleeps, and steers dream flashes toward your neighbours.", ru: "Окутывает твою клетку тёплым светом, ярче всего когда разум спит, и направляет вспышки снов к твоим соседям." } } },
  { id: "moth", name: { en: "Moth", ru: "Мотылёк" }, color: "#b9a6f5", rows: ["#.....#", "##...##", "#o#.#o#", ".##x##.", "..###..", "..#.#..", "......."], perk: { name: { en: "Drawn to Light", ru: "На свет" }, desc: { en: "Flies over to whichever other cell just spoke and circles it, so you can see where the action is.", ru: "Летит к той чужой клетке, что только что заговорила, и кружит вокруг, показывая, где сейчас движение." } } },
  { id: "blob", name: { en: "Blob", ru: "Комок" }, color: "#6fd6ff", rows: [".......", "..###..", ".#ooo#.", "#oxoxo#", "#ooooo#", ".#####.", "......."], perk: { name: { en: "Bouncy", ru: "Попрыгун" }, desc: { en: "Bounces on every letter you type in the chat, and hops when your cell speaks.", ru: "Подпрыгивает на каждую букву, которую ты печатаешь в чате, и когда твоя клетка говорит." } } },
  { id: "ghost", name: { en: "Ghost", ru: "Призрак" }, color: "#e8ecff", needs: "sleepwalker", hint: { en: "Watch the mind fall asleep", ru: "Увидь, как разум засыпает" }, rows: ["..###..", ".#ooo#.", "#oxoxo#", "#ooooo#", "#ooooo#", "#o#o#o#", ".#.#.#."], perk: { name: { en: "Haunting", ru: "Наведывается" }, desc: { en: "Every so often drifts over to someone else's cell and whispers its number, so you discover the other voices.", ru: "Время от времени подлетает к чужой клетке и шепчет её номер, так что ты находишь другие голоса." } } },
  { id: "comet", name: { en: "Comet", ru: "Комета" }, color: "#ffd166", needs: "time-traveler", hint: { en: "Watch a whole timelapse", ru: "Досмотри таймлапс до конца" }, rows: ["#......", ".#.....", "..##...", "..#o#..", "...#o#.", "....##.", "......."], perk: { name: { en: "Warp", ru: "Варп" }, desc: { en: "Races around on a long trail, whooshes across the brain now and then, and unlocks 8x speed in the timelapse.", ru: "Носится с длинным хвостом, время от времени пролетает через весь мозг и открывает скорость 8x в таймлапсе." } } },
  { id: "eyebit", name: { en: "Eyebit", ru: "Глазок" }, color: "#ff9be0", needs: "eye-contact", hint: { en: "A hidden achievement…", ru: "Скрытое достижение…" }, rows: [".......", "..###..", ".#ooo#.", "#oxxxo#", ".#ooo#.", "..###..", "......."], perk: { name: { en: "Inspector", ru: "Инспектор" }, desc: { en: "Its pupil follows your mouse, and the hover tooltip on the brain also shows who holds each cell.", ru: "Зрачок следит за мышью, а подсказка при наведении на мозг показывает ещё и владельца клетки." } } },
];
export const PET_BY_ID = new Map(PETS.map((p) => [p.id, p]));

const KEY = "synnod-pet";
const listeners = new Set<() => void>();
let choice: string | null = null;
let loaded = false;

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const v = window.localStorage.getItem(KEY);
    choice = v && PET_BY_ID.has(v) ? v : null;
  } catch {
    /* storage blocked */
  }
}
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

// The chosen pet id (or null). Whether it is actually unlocked is checked by the caller.
export function usePet() {
  const id = useSyncExternalStore(
    subscribe,
    () => {
      load();
      return choice ?? "";
    },
    () => ""
  );
  const choose = useCallback((next: string | null) => {
    choice = next;
    try {
      if (next) window.localStorage.setItem(KEY, next);
      else window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }, []);
  return { id: id || null, choose };
}

const shade = (hex: string, to: number, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
export const petPalette = (color: string) => ({ "#": color, o: shade(color, 255, 0.55), x: shade(color, 0, 0.6) }) as Record<string, string>;
