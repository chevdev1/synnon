"use client";

import { useSyncExternalStore } from "react";

// Help mode: press "?" in the header, every block gets a badge and a plain
// language explanation for people who have never touched crypto or AI apps.

export type Lang = "en" | "ru";
type T = Record<Lang, string>;

interface HelpState {
  on: boolean;
  lang: Lang;
  active: string | null;
  glossary: boolean;
}

const LANG_KEY = "synnod-help-lang";
const initial: HelpState = { on: false, lang: "en", active: null, glossary: false };
let state: HelpState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function set(patch: Partial<HelpState>) {
  state = { ...state, ...patch };
  if ("on" in patch) {
    if (state.on) document.documentElement.setAttribute("data-help", "on");
    else document.documentElement.removeAttribute("data-help");
  }
  listeners.forEach((l) => l());
}

function load() {
  if (loaded) return;
  loaded = true;
  let lang: Lang = navigator.language?.toLowerCase().startsWith("ru") ? "ru" : "en";
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved === "ru" || saved === "en") lang = saved;
  } catch {
    /* storage blocked: keep the browser default */
  }
  state = { ...state, lang };
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const snapshot = () => {
  load();
  return state;
};

export const useHelp = () => useSyncExternalStore(subscribe, snapshot, () => initial);

export const helpActions = {
  toggle: () => set(state.on ? { on: false, active: null, glossary: false } : { on: true, active: null }),
  close: () => set({ on: false, active: null, glossary: false }),
  setActive: (id: string | null) => set({ active: id, glossary: false }),
  toggleGlossary: () => set({ glossary: !state.glossary, active: null }),
  setLang: (lang: Lang) => {
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
    set({ lang });
  },
  tour: (dir: 1 | -1) => {
    const i = state.active ? TOUR.indexOf(state.active) : -1;
    const next = i === -1 ? (dir === 1 ? 0 : TOUR.length - 1) : (i + dir + TOUR.length) % TOUR.length;
    set({ active: TOUR[next], glossary: false });
  },
};

// Order of the guided tour (also the reading order of the page).
export const TOUR = ["intro", "brain", "face", "pet", "timelapse", "search", "mind", "node", "chat", "memory", "thoughts", "character", "connect", "demo", "music", "motion", "tod", "achievements"];

export const HELP: Record<string, { title: T; body: T }> = {
  intro: {
    title: { en: "What is SYNNOD?", ru: "Что такое SYNNOD?" },
    body: {
      en: "One shared AI character with no single author. It has 128 “voices” — the cells of the brain in the middle. Below you can see how many are talking right now, how many hold a memory and how many are still free. The wavy line is the recent activity.",
      ru: "Это один общий ИИ-персонаж, у которого нет одного автора. У него 128 «голосов» — клетки мозга в центре. Ниже видно, сколько клеток сейчас говорят, сколько хранят память и сколько ещё свободны. Волнистая линия — недавняя активность.",
    },
  },
  brain: {
    title: { en: "The brain", ru: "Мозг" },
    body: {
      en: "Every hexagon is a spot for one person (128 in total). Hover a cell to see its number and status. Click a free one to take it. Glowing cells spoke to the AI recently; the green outline is your own cell.",
      ru: "Каждый шестиугольник — место одного человека (всего 128). Наведи на клетку — увидишь номер и статус. Кликни по свободной, чтобы занять её. Светящиеся клетки недавно говорили с ИИ, зелёный контур — твоя клетка.",
    },
  },
  face: {
    title: { en: "The face of the mind", ru: "Лицо разума" },
    body: {
      en: "One pixel eye that shows what the mind is doing. It blinks and looks around when awake, spins while it thinks about your message, “speaks” while the reply is typed, and falls asleep (with a Z) when nobody has spoken for a few minutes. The iris colour is its mood.",
      ru: "Один пиксельный глаз показывает, что делает разум. Пока бодрствует — моргает и оглядывается, крутит зрачком, когда думает над твоим сообщением, «говорит», пока печатается ответ, и засыпает (появляется Z), если несколько минут никто не говорил. Цвет радужки — настроение.",
    },
  },
  pet: {
    title: { en: "Companion", ru: "Спутник" },
    body: {
      en: "A tiny pixel creature that keeps your cell company: it orbits the cell, hops when your cell speaks and falls asleep with the mind. Pick one here. Three are free, three are earned through achievements. It shows up next to your own cell, so claim one first.",
      ru: "Крошечное пиксельное существо, которое составляет компанию твоей клетке: кружит вокруг неё, подпрыгивает, когда клетка говорит, и засыпает вместе с разумом. Выбери здесь. Три бесплатные, три можно получить достижениями. Он появляется возле твоей клетки, поэтому сначала займи её.",
    },
  },
  timelapse: {
    title: { en: "Timelapse", ru: "Таймлапс" },
    body: {
      en: "A fast replay of the last 24 hours (or the whole history if it is quiet), squeezed into about 20 seconds: cells appear when they were claimed, flash when they spoke, and sparks jump between the cells behind each thought. Pause, change speed or close it any time.",
      ru: "Ускоренная перемотка последних 24 часов (или всей истории, если было тихо) за ~20 секунд: клетки появляются, когда их заняли, вспыхивают, когда говорили, а искры перескакивают между клетками, из которых родилась мысль. Можно поставить на паузу, ускорить или закрыть.",
    },
  },
  search: {
    title: { en: "Find a node", ru: "Поиск клетки" },
    body: {
      en: "Type a cell number (48 or #48) or part of a nickname. The cell pulses pink on the brain and its card opens. Useful because 128 hexagons look alike.",
      ru: "Введи номер клетки (48 или #48) или часть ника. Клетка вспыхнет розовым на мозге и откроется её карточка. Удобно, когда 128 шестиугольников выглядят одинаково.",
    },
  },
  mind: {
    title: { en: "The mind", ru: "Разум" },
    body: {
      en: "How the AI describes itself. It appeared without a name and builds itself from what people tell it. The little picture is its imagined world.",
      ru: "Так ИИ рассказывает о себе. Он появился без имени и собирает себя из того, что ему рассказывают люди. Картинка — воображаемый мир персонажа.",
    },
  },
  node: {
    title: { en: "Your node", ru: "Твоя клетка" },
    body: {
      en: "Your own cell: its number, status (active = talking now, memory = it left a memory) and who owns it. If you have no cell yet, this is where you sign in and claim one.",
      ru: "Твоя собственная клетка: номер, статус (active — говорит сейчас, memory — оставила воспоминание) и владелец. Если клетки ещё нет, здесь можно войти и занять её.",
    },
  },
  chat: {
    title: { en: "Talk to the AI", ru: "Общение с ИИ" },
    body: {
      en: "Chat with the AI through your cell. Tell it a place, a memory or an image — it answers and remembers it in the shared memory that all 128 people feed. Only the owner of a cell can write through it.",
      ru: "Чат с ИИ через твою клетку. Расскажи место, воспоминание или образ — он ответит и запомнит это в общей памяти, которую наполняют все 128 человек. Писать через клетку может только её владелец.",
    },
  },
  memory: {
    title: { en: "Memory archive", ru: "Архив памяти" },
    body: {
      en: "What people told the AI and what it remembered. Tabs: Recent = newest, Popular = from the most active cells, Mine = yours. Private details are never published.",
      ru: "Что люди рассказали ИИ и что он запомнил. Вкладки: Recent — новые, Popular — от самых активных клеток, Mine — твои. Личные данные не публикуются.",
    },
  },
  thoughts: {
    title: { en: "Autonomous thoughts", ru: "Мысли ИИ" },
    body: {
      en: "Short thoughts the AI says on its own, without anyone asking, based on everything it has been told. New ones appear from time to time.",
      ru: "Короткие мысли, которые ИИ говорит сам, без запроса, опираясь на всё, что ему рассказали. Новые появляются время от времени.",
    },
  },
  character: {
    title: { en: "Character", ru: "Характер" },
    body: {
      en: "The AI's personality: mood and traits. It is one character for everyone and it slowly changes with what people tell it.",
      ru: "Личность ИИ: настроение и черты. Он один на всех и постепенно меняется от того, что ему рассказывают.",
    },
  },
  connect: {
    title: { en: "Connect wallet", ru: "Подключить кошелёк" },
    body: {
      en: "Needed to claim a cell. You sign a short message in your wallet (MetaMask etc.) — it is free, it is not a payment and it does not move any money. Claiming a cell also needs test tokens (tSYNOD): the button “Get test tSYNOD” is in the cell window.",
      ru: "Нужно, чтобы занять клетку. Ты подписываешь короткое сообщение в кошельке (MetaMask и т.п.) — это бесплатно, это не платёж и деньги не двигаются. Для клетки ещё нужны тестовые токены (tSYNOD): кнопка «Get test tSYNOD» есть в окне клетки.",
    },
  },
  demo: {
    title: { en: "Demo / Live data", ru: "Demo / Live данные" },
    body: {
      en: "DEMO shows made-up activity so you can see how the site looks when it is busy. LIVE shows only real data from the server: real cells, real memories.",
      ru: "DEMO показывает выдуманную активность, чтобы было видно, как выглядит сайт, когда он «живой». LIVE — только настоящие данные с сервера: реальные клетки и воспоминания.",
    },
  },
  music: {
    title: { en: "Music", ru: "Музыка" },
    body: {
      en: "Calm lo-fi background music, generated right in your browser. Click to turn it on or off.",
      ru: "Спокойная фоновая lo-fi музыка, которая генерируется прямо в браузере. Нажми, чтобы включить или выключить.",
    },
  },
  motion: {
    title: { en: "Animations", ru: "Анимации" },
    body: {
      en: "Turns the animations on or off. If your system has “reduce motion” enabled, the site stays still until you switch this on.",
      ru: "Включает и выключает анимации. Если в системе включено «уменьшить движение», сайт остаётся неподвижным, пока ты не включишь эту кнопку.",
    },
  },
  achievements: {
    title: { en: "Achievements", ru: "Достижения" },
    body: {
      en: "Like in a game: a pop-up appears when you earn something, for example linking a wallet, claiming a cell, getting your first reply or seeing the mind fall asleep. Four rarities (bronze, silver, gold, legendary) and a few hidden ones. Click the trophy to see them all and your progress.",
      ru: "Как в играх: всплывает окно, когда ты что-то получаешь, например привязал кошелёк, занял клетку, получил первый ответ или увидел, как разум засыпает. Четыре редкости (бронза, серебро, золото, легенда) и несколько скрытых. Нажми на кубок, чтобы увидеть все и свой прогресс.",
    },
  },
  tod: {
    title: { en: "Time of day", ru: "Время суток" },
    body: {
      en: "The whole site follows your local clock: warm pink at dawn, cool blue by day, magenta at dusk, deep violet at night. Click to pin a phase and see the others; “auto” goes back to your clock.",
      ru: "Весь сайт следует за твоими часами: тёплый розовый на рассвете, прохладный синий днём, малиновый на закате, глубокий фиолетовый ночью. Нажми, чтобы зафиксировать любую фазу и посмотреть остальные; «auto» вернёт по твоим часам.",
    },
  },
};

export const GLOSSARY: { term: T; def: T }[] = [
  {
    term: { en: "Wallet", ru: "Кошелёк" },
    def: {
      en: "A browser extension (for example MetaMask) that holds your digital address. It works like a login: instead of a password you approve actions inside it.",
      ru: "Расширение для браузера (например MetaMask), где хранится твой цифровой адрес. Работает как вход: вместо пароля ты подтверждаешь действия внутри него.",
    },
  },
  {
    term: { en: "Signature", ru: "Подпись" },
    def: {
      en: "Approving a short message in your wallet to prove the address is yours. It costs nothing and does not send money.",
      ru: "Подтверждение короткого сообщения в кошельке, чтобы доказать, что адрес твой. Бесплатно и деньги не отправляются.",
    },
  },
  {
    term: { en: "Test network", ru: "Тестовая сеть" },
    def: {
      en: "A practice copy of a blockchain. Everything in it is free and worth nothing, so nobody can lose real money there.",
      ru: "Учебная копия блокчейна. Всё в ней бесплатное и ничего не стоит, поэтому реальные деньги потерять нельзя.",
    },
  },
  {
    term: { en: "Test ETH", ru: "Тестовый ETH" },
    def: {
      en: "“Fuel” for the test network: every action costs a tiny fee. You get it for free from a faucet (a giveaway site).",
      ru: "«Бензин» тестовой сети: каждое действие стоит крошечную комиссию. Его бесплатно выдаёт кран (сайт-раздатчик).",
    },
  },
  {
    term: { en: "tSYNOD", ru: "tSYNOD" },
    def: {
      en: "Our test token. You need to hold some to claim a cell. The real token will replace it later; the button in the cell window gives you test ones for free.",
      ru: "Наш тестовый токен. Чтобы занять клетку, нужно иметь его на кошельке. Позже его заменит настоящий; кнопка в окне клетки бесплатно выдаёт тестовые.",
    },
  },
  {
    term: { en: "Cell / node", ru: "Клетка / нода" },
    def: {
      en: "One of the 128 hexagons of the brain. Whoever claims it can talk to the AI through it.",
      ru: "Один из 128 шестиугольников мозга. Тот, кто занял клетку, может говорить с ИИ через неё.",
    },
  },
];

export const UI: Record<string, T> = {
  helpMode: { en: "Help mode", ru: "Режим помощи" },
  hint: { en: "Click a ? badge for an explanation", ru: "Нажми на значок ? — расскажу, что это" },
  tour: { en: "Tour", ru: "Экскурсия" },
  next: { en: "Next", ru: "Далее" },
  prev: { en: "Back", ru: "Назад" },
  glossary: { en: "Glossary", ru: "Словарик" },
  close: { en: "Close", ru: "Закрыть" },
};
