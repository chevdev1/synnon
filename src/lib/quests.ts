// Daily quests: three small things to do each day. Finish at least one and the day
// counts toward your streak. Everything here is a "thing you do on the site", so it is
// remembered in this browser (demo and live keep separate books).
type T = { en: string; ru: string };

export type QEvent = "search" | "visit" | "timelapse" | "console" | "tod" | "diary" | "mind" | "pet" | "speak" | "question";

export interface Quest {
  id: string;
  event: QEvent;
  target: number;
  needsCell?: boolean;
  href?: string; // where to go to do it
  name: T;
  desc: T;
}

const q = (id: string, event: QEvent, target: number, name: T, desc: T, extra: Partial<Quest> = {}): Quest => ({ id, event, target, name, desc, ...extra });

// Anyone can do these.
const OPEN: Quest[] = [
  q("search", "search", 1, { en: "Cartographer's errand", ru: "Поручение картографа" }, { en: "Find a cell with the search box.", ru: "Найди клетку через поиск." }, { href: "/" }),
  q("visit", "visit", 2, { en: "House calls", ru: "Визиты" }, { en: "Open the cards of 2 voices.", ru: "Открой карточки двух голосов." }, { href: "/" }),
  q("timelapse", "timelapse", 1, { en: "Fast forward", ru: "Перемотка" }, { en: "Start a timelapse.", ru: "Запусти таймлапс." }, { href: "/" }),
  q("console", "console", 3, { en: "At the console", ru: "У консоли" }, { en: "Run 3 console commands.", ru: "Выполни 3 команды консоли." }, { href: "/" }),
  q("tod", "tod", 2, { en: "Follow the sun", ru: "За солнцем" }, { en: "Change the time of day twice.", ru: "Дважды смени время суток." }, { href: "/" }),
  q("diary", "diary", 1, { en: "Read the diary", ru: "Почитать дневник" }, { en: "Read a page of the mind's diary.", ru: "Прочитай страницу дневника разума." }, { href: "/diary" }),
  q("mind", "mind", 1, { en: "Check on the mind", ru: "Проведать разум" }, { en: "Look at the mind's stage and picture of the day.", ru: "Загляни на стадию разума и картину дня." }, { href: "/mind" }),
  q("pet", "pet", 1, { en: "Pet time", ru: "Время питомца" }, { en: "Pick or change your companion.", ru: "Выбери или смени спутника." }, { href: "/" }),
];
// These need a cell of your own.
const CELL: Quest[] = [
  q("speak", "speak", 1, { en: "Say something", ru: "Скажи что-нибудь" }, { en: "Tell the mind something through your cell.", ru: "Расскажи разуму что-нибудь через свою клетку." }, { needsCell: true, href: "/" }),
  q("question", "question", 1, { en: "Answer the week", ru: "Ответить на неделю" }, { en: "Answer the question of the week.", ru: "Ответь на вопрос недели." }, { needsCell: true, href: "/question" }),
];

export const QUESTS = [...OPEN, ...CELL];
export const QUEST_BY_ID = new Map(QUESTS.map((x) => [x.id, x]));

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const yesterdayKey = (d = new Date()) => dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));

function hash(s: string) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
}

// The same three quests for everyone on a given day: two open ones and one more from the full list.
export function questsForDay(day: string): Quest[] {
  let h = hash(day);
  const next = () => (h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0);
  const pool = [...OPEN];
  const out: Quest[] = [];
  for (let i = 0; i < 2; i++) out.push(pool.splice(next() % pool.length, 1)[0]);
  const rest = [...pool, ...CELL];
  out.push(rest[next() % rest.length]);
  return out;
}

// Streak rewards, shown on the daily page.
export const STREAK_REWARDS: { days: number; text: T }[] = [
  { days: 3, text: { en: "A three-day habit", ru: "Привычка на три дня" } },
  { days: 7, text: { en: "Weekly Ritual achievement + the Ember companion", ru: "Достижение «Недельный ритуал» + спутник Уголёк" } },
  { days: 14, text: { en: "Two weeks in a row", ru: "Две недели подряд" } },
  { days: 30, text: { en: "Devoted achievement", ru: "Достижение «Верность»" } },
];
