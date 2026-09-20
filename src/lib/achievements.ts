import type { NodeProfile } from "@/lib/nodeProfile";

// Steam-style achievements. Two families:
//  - "derived": computed from real data (the wallet, the cell, its voices, thoughts...),
//    so they can never be faked and survive clearing the browser;
//  - "visitor": things you DO on the site (search, timelapse, ...), remembered in this browser.
export type Tier = "bronze" | "silver" | "gold" | "legend";
export type IconKey = "flame" | "hex" | "eye" | "wallet" | "star" | "bolt" | "moon" | "sun" | "compass" | "clock" | "book" | "brain" | "ghost" | "tv" | "trophy";
type T = { en: string; ru: string };

export interface Ach {
  id: string;
  tier: Tier;
  icon: IconKey;
  derived?: boolean;
  hidden?: boolean; // shown as "???" until unlocked
  max?: number; // progressive: needs this many
  name: T;
  desc: T;
}

export const TIER_COLOR: Record<Tier, string> = { bronze: "#d99a68", silver: "#c9d3f0", gold: "#ffd166", legend: "#ff9be0" };
export const TIER_LABEL: Record<Tier, T> = {
  bronze: { en: "Bronze", ru: "Бронза" },
  silver: { en: "Silver", ru: "Серебро" },
  gold: { en: "Gold", ru: "Золото" },
  legend: { en: "Legendary", ru: "Легенда" },
};

const a = (id: string, tier: Tier, icon: IconKey, name: T, desc: T, extra: Partial<Ach> = {}): Ach => ({ id, tier, icon, name, desc, ...extra });

export const ACHIEVEMENTS: Ach[] = [
  a("first-light", "bronze", "eye", { en: "First Light", ru: "Первый свет" }, { en: "You opened your eyes inside the mind.", ru: "Ты открыл глаза внутри разума." }),
  a("asked-directions", "bronze", "compass", { en: "Asking for Directions", ru: "Спросил дорогу" }, { en: "You opened the help mode.", ru: "Ты открыл режим помощи." }),
  a("anonymous-signal", "bronze", "ghost", { en: "Anonymous Signal", ru: "Аноним в эфире" }, { en: "You came in with just a nickname. The mind noticed a ghost.", ru: "Ты зашёл под одним ником. Разум заметил призрака." }, { derived: true }),
  a("cartographer", "bronze", "compass", { en: "Cartographer", ru: "Картограф" }, { en: "You found a cell by its number or name.", ru: "Ты нашёл клетку по номеру или имени." }),
  a("adopted", "bronze", "ghost", { en: "Not Alone", ru: "Не один" }, { en: "You adopted a companion for your cell.", ru: "Ты завёл спутника для своей клетки." }),
  a("command-line", "bronze", "tv", { en: "Command Line", ru: "Командная строка" }, { en: "You used the brain console.", ru: "Ты воспользовался консолью мозга." }),
  a("secret-handshake", "silver", "ghost", { en: "Secret Handshake", ru: "Тайное рукопожатие" }, { en: "You found a secret console command.", ru: "Ты нашёл секретную команду консоли." }, { hidden: true }),
  a("growing-up", "silver", "star", { en: "Growing Up", ru: "Взросление" }, { en: "You saw the mind reach a new stage of growth.", ru: "Ты увидел, как разум перешёл на новую стадию роста." }),
  a("answered-mind", "bronze", "book", { en: "Answered the Mind", ru: "Ответил разуму" }, { en: "You answered the question of the week.", ru: "Ты ответил на вопрос недели." }),
  a("daily-trio", "bronze", "flame", { en: "Perfect Day", ru: "Идеальный день" }, { en: "You finished all three daily quests in one day.", ru: "Ты выполнил все три задания дня за один день." }),
  a("streak-week", "silver", "flame", { en: "Weekly Ritual", ru: "Недельный ритуал" }, { en: "You kept a 7-day streak. A companion joins you.", ru: "Ты продержал серию 7 дней. К тебе присоединяется спутник." }, { max: 7 }),
  a("streak-month", "gold", "flame", { en: "Devoted", ru: "Верность" }, { en: "You kept a 30-day streak.", ru: "Ты продержал серию 30 дней." }, { max: 30 }),
  a("goal-gold", "silver", "star", { en: "Golden Sky", ru: "Золотое небо" }, { en: "You were here when the community reached its weekly goal.", ru: "Ты был здесь, когда сообщество выполнило цель недели." }),
  a("pet-grown", "bronze", "ghost", { en: "Growing Together", ru: "Растём вместе" }, { en: "Your companion grew up after 3 days together.", ru: "Твой спутник вырос после 3 дней вместе." }),
  a("pet-elder", "silver", "ghost", { en: "Old Friends", ru: "Старые друзья" }, { en: "Your companion became an Elder after 10 days together.", ru: "Твой спутник стал взрослым после 10 дней вместе." }),
  a("pet-legend", "gold", "ghost", { en: "Inseparable", ru: "Неразлучны" }, { en: "Your companion became a Legend after 30 days together.", ru: "Твой спутник стал легендой после 30 дней вместе." }),
  a("sky-rain", "bronze", "clock", { en: "Caught in the Rain", ru: "Попал под дождь" }, { en: "You watched the rain fall over the mind.", ru: "Ты смотрел, как над разумом идёт дождь." }),
  a("sky-snow", "bronze", "star", { en: "Snow Day", ru: "Снежный день" }, { en: "You watched the snow fall over the mind.", ru: "Ты смотрел, как над разумом идёт снег." }),
  a("sky-storm", "silver", "bolt", { en: "Thunder Watcher", ru: "Свидетель грозы" }, { en: "You sat through a thunderstorm and saw the lightning.", ru: "Ты пересидел грозу и увидел молнии." }),
  a("sky-collector", "gold", "compass", { en: "Weather Watcher", ru: "Метеонаблюдатель" }, { en: "You saw rain, snow and a thunderstorm over the mind.", ru: "Ты увидел над разумом дождь, снег и грозу." }),
  a("sky-shower", "silver", "moon", { en: "Wish Upon a Star", ru: "Загадал желание" }, { en: "You were here on a night of falling stars.", ru: "Ты был здесь в ночь звездопада." }, { hidden: true }),
  a("sky-fireworks", "silver", "sun", { en: "New Year in the Mind", ru: "Новый год в разуме" }, { en: "You watched the fireworks on New Year.", ru: "Ты видел новогодний салют." }, { hidden: true }),
  a("night-owl", "bronze", "moon", { en: "Night Owl", ru: "Сова" }, { en: "You visited between 2 and 5 a.m.", ru: "Ты заглянул между 2 и 5 утра." }),
  a("diarist", "bronze", "book", { en: "Between the Lines", ru: "Между строк" }, { en: "You read a page of the mind's diary.", ru: "Ты прочитал страницу дневника разума." }),
  a("first-words", "bronze", "book", { en: "First Words", ru: "Первые слова" }, { en: "Your cell spoke and the mind answered.", ru: "Твоя клетка заговорила, и разум ответил." }, { derived: true }),

  a("uplink", "silver", "wallet", { en: "Uplink Established", ru: "Связь установлена" }, { en: "You linked a wallet. The mind now recognises your signature.", ru: "Ты привязал кошелёк. Теперь разум узнаёт твою подпись." }, { derived: true }),
  a("first-cell", "silver", "hex", { en: "A Voice of Your Own", ru: "Свой голос" }, { en: "You claimed a cell. One of 128 is now yours.", ru: "Ты занял клетку. Одна из 128 теперь твоя." }, { derived: true }),
  a("chatter", "silver", "book", { en: "Chatterbox", ru: "Болтун" }, { en: "10 voices told through your cell.", ru: "10 историй рассказано через твою клетку." }, { derived: true, max: 10 }),
  a("thought-seed", "silver", "bolt", { en: "Thought Seed", ru: "Зерно мысли" }, { en: "A thought grew out of your words.", ru: "Из твоих слов выросла мысль." }, { derived: true, max: 1 }),
  a("long-memory", "silver", "brain", { en: "Long Memory", ru: "Долгая память" }, { en: "3 of your replies are still in the mind's memory.", ru: "3 твоих ответа всё ещё в памяти разума." }, { derived: true, max: 3 }),
  a("time-traveler", "silver", "clock", { en: "Time Traveler", ru: "Путешественник во времени" }, { en: "You watched a whole timelapse to the end.", ru: "Ты досмотрел таймлапс до конца." }),
  a("sun-chaser", "silver", "sun", { en: "Sun Chaser", ru: "Погоня за солнцем" }, { en: "You saw the brain at dawn, by day, at dusk and at night.", ru: "Ты увидел мозг на рассвете, днём, на закате и ночью." }, { max: 4 }),
  a("sleepwalker", "silver", "ghost", { en: "Sleepwalker", ru: "Лунатик" }, { en: "You watched the mind fall asleep.", ru: "Ты видел, как разум засыпает." }),
  a("witness", "silver", "bolt", { en: "Witness", ru: "Свидетель" }, { en: "You saw a cell get claimed, live.", ru: "Ты увидел, как занимают клетку, вживую." }),
  a("eye-contact", "silver", "eye", { en: "Eye Contact", ru: "Зрительный контакт" }, { en: "You poked the eye seven times. It blinked back.", ru: "Ты семь раз ткнул в глаз. Он моргнул в ответ." }, { hidden: true, max: 7 }),

  a("storyteller", "gold", "book", { en: "Storyteller", ru: "Рассказчик" }, { en: "25 voices told through your cell.", ru: "25 историй рассказано через твою клетку." }, { derived: true, max: 25 }),
  a("mind-weaver", "gold", "brain", { en: "Mind Weaver", ru: "Ткач разума" }, { en: "5 thoughts shaped by your cell.", ru: "5 мыслей рождены из твоей клетки." }, { derived: true, max: 5 }),
  a("share-of-mind", "gold", "star", { en: "Voice of the Mind", ru: "Голос разума" }, { en: "10% of everything the mind has answered came through you (3+ voices).", ru: "10% всех ответов разума прошли через тебя (от 3 голосов)." }, { derived: true, max: 10 }),
  a("broadcaster", "gold", "tv", { en: "Broadcaster", ru: "Вещатель" }, { en: "You recorded an animated card.", ru: "Ты записал анимированную карточку." }),

  a("chorus", "legend", "star", { en: "Choir of One", ru: "Хор из одного" }, { en: "50 voices. The mind knows your cadence.", ru: "50 голосов. Разум знает твой ритм." }, { derived: true, max: 50 }),
];

export const ACH_BY_ID = new Map(ACHIEVEMENTS.map((x) => [x.id, x]));

// Sections on the achievements page.
export type Cat = "start" | "voice" | "explore";
export const CATS: { id: Cat; name: T }[] = [
  { id: "start", name: { en: "Getting started", ru: "Начало пути" } },
  { id: "voice", name: { en: "Your voice", ru: "Твой голос" } },
  { id: "explore", name: { en: "Explorer", ru: "Исследователь" } },
];
const CAT_OF: Record<string, Cat> = {
  "first-light": "start", "asked-directions": "start", "anonymous-signal": "start", uplink: "start", "first-cell": "start",
  "first-words": "voice", chatter: "voice", storyteller: "voice", chorus: "voice", "thought-seed": "voice", "mind-weaver": "voice", "long-memory": "voice", "share-of-mind": "voice",
};
export const catOf = (a: Ach): Cat => CAT_OF[a.id] ?? "explore";

// "Mind Score": rarer achievements are worth more; the level is how far the score goes.
export const POINTS: Record<Tier, number> = { bronze: 5, silver: 10, gold: 25, legend: 100 };
export const LEVELS: { at: number; name: T }[] = [
  { at: 0, name: { en: "Static", ru: "Помехи" } },
  { at: 20, name: { en: "Signal", ru: "Сигнал" } },
  { at: 60, name: { en: "Spark", ru: "Искра" } },
  { at: 120, name: { en: "Voice", ru: "Голос" } },
  { at: 220, name: { en: "Weaver", ru: "Ткач" } },
  { at: 335, name: { en: "Mind", ru: "Разум" } },
];
export function levelOf(score: number) {
  let i = 0;
  LEVELS.forEach((l, k) => score >= l.at && (i = k));
  const next = LEVELS[i + 1];
  return { index: i, level: LEVELS[i], next, pct: next ? (score - LEVELS[i].at) / (next.at - LEVELS[i].at) : 1 };
}
export const MAX_SCORE = ACHIEVEMENTS.reduce((s, x) => s + POINTS[x.tier], 0);

export interface DeriveInput {
  me: { name: string; wallet?: string | null; nodeId: number | null } | null;
  profile: NodeProfile | null;
}

// Progress of every derived achievement from real data. cur >= max (or >= 1 when
// there is no max) means done.
export function derive({ me, profile }: DeriveInput): Record<string, number> {
  const out: Record<string, number> = {};
  if (me && !me.wallet) out["anonymous-signal"] = 1;
  if (me?.wallet) out["uplink"] = 1;
  if (me?.nodeId) out["first-cell"] = 1;
  Object.assign(out, deriveCell(profile));
  return out;
}

// Only what a cell's own numbers say (also used for the badges on a cell's profile).
export function deriveCell(profile: NodeProfile | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (!profile) return out;
  const { voices, thoughtsShaped, inMemory, sharePct } = profile.stats;
  out["first-words"] = voices >= 1 ? 1 : 0;
  out["chatter"] = Math.min(voices, 10);
  out["storyteller"] = Math.min(voices, 25);
  out["chorus"] = Math.min(voices, 50);
  out["thought-seed"] = Math.min(thoughtsShaped, 1);
  out["mind-weaver"] = Math.min(thoughtsShaped, 5);
  out["long-memory"] = Math.min(inMemory, 3);
  out["share-of-mind"] = voices >= 3 ? Math.min(Math.floor(sharePct), 10) : 0;
  return out;
}

export const isDone = (a: Ach, cur: number) => cur >= (a.max ?? 1);

export const CELL_ACH_IDS = ["first-words", "chatter", "storyteller", "chorus", "thought-seed", "mind-weaver", "long-memory", "share-of-mind"];
