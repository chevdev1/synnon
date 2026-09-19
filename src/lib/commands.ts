import type { BrainNode, PulseEvent } from "@/lib/brain/types";
import { achActions } from "@/lib/achStore";
import { MOODS, mindActions } from "@/lib/mind";
import { PETS } from "@/lib/pets";
import { skyActions } from "@/lib/sky";
import { todActions, type TodMode } from "@/lib/tod";

// The brain console: local commands that poke the interface so you can see how the
// brain reacts. Effects are visual and only on YOUR screen; nothing is sent to the
// server, and the console never writes as the mind (secret replies are stage
// directions in *stars*, not invented speech).
type Tone = "ok" | "err" | "info";
type T = { en: string; ru: string };

export interface CmdEnv {
  nodes: BrainNode[];
  myNode: number | null;
  unlocked: Record<string, number>;
  lang: "en" | "ru";
  inject: (e: PulseEvent) => void;
  say: (text: string, tone?: Tone) => void;
  clear: () => void;
  setPet: (id: string | null) => void;
}

export interface Cmd {
  name: string;
  usage?: string;
  help: T;
  secret?: boolean;
  run: (args: string[], env: CmdEnv) => void;
}

const L = (env: CmdEnv, en: string, ru: string) => (env.lang === "ru" ? ru : en);
const taken = (env: CmdEnv) => env.nodes.filter((n) => n.status !== "available");
const pick = <X,>(a: X[]) => a[Math.floor(Math.random() * a.length)];
const cellArg = (env: CmdEnv, raw?: string): number | null => {
  if (!raw) return null;
  const n = Number(raw.replace("#", ""));
  return Number.isInteger(n) && env.nodes.some((x) => x.id === n) ? n : NaN;
};

export const COMMANDS: Cmd[] = [
  {
    name: "help",
    help: { en: "list the commands", ru: "список команд" },
    run: (_a, env) => {
      env.say(L(env, "Commands (effects are local, only you see them):", "Команды (эффекты локальные, их видишь только ты):"), "info");
      COMMANDS.filter((c) => !c.secret).forEach((c) => env.say(`/${c.name}${c.usage ? " " + c.usage : ""}  ${env.lang === "ru" ? c.help.ru : c.help.en}`, "info"));
    },
  },
  {
    name: "dream",
    help: { en: "the mind falls asleep (a minute, or /wake)", ru: "разум засыпает (на минуту или до /wake)" },
    run: (_a, env) => {
      mindActions.force({ state: "sleeping" });
      env.say(L(env, "The mind falls asleep. Watch the breathing slow and the old memories flicker. /wake to end.", "Разум засыпает. Смотри, как замедляется дыхание и мерцают старые воспоминания. /wake, чтобы разбудить."), "ok");
    },
  },
  {
    name: "wake",
    help: { en: "wake the mind up", ru: "разбудить разум" },
    run: (_a, env) => {
      mindActions.force({ state: null, mood: null });
      env.say(L(env, "The mind wakes up.", "Разум просыпается."), "ok");
    },
  },
  {
    name: "pulse",
    usage: "[cell]",
    help: { en: "a voice is answered: sparks from a cell", ru: "голосу отвечают: искры от клетки" },
    run: (a, env) => {
      const c = cellArg(env, a[0]);
      if (Number.isNaN(c)) return env.say(L(env, "No such cell. Use a number from 1 to 128.", "Нет такой клетки. Укажи число от 1 до 128."), "err");
      const id = c ?? env.myNode ?? pick(taken(env))?.id;
      if (id == null) return env.say(L(env, "Nothing to pulse yet: no cells are taken.", "Пока нечему пульсировать: нет занятых клеток."), "err");
      env.inject({ nodeId: id, type: "output" });
      env.say(L(env, `Pulse from cell ${id}.`, `Пульс от клетки ${id}.`), "ok");
    },
  },
  {
    name: "thought",
    help: { en: "a thought: sparks jump between 3 cells", ru: "мысль: искры между тремя клетками" },
    run: (_a, env) => {
      const pool = taken(env);
      if (pool.length < 2) return env.say(L(env, "A thought needs at least two taken cells.", "Для мысли нужны минимум две занятые клетки."), "err");
      const ids = [...pool].sort(() => Math.random() - 0.5).slice(0, 3).map((n) => n.id);
      env.inject({ nodeId: ids[0], type: "thought", links: ids.slice(1) });
      env.say(L(env, `A thought grows out of cells ${ids.join(", ")}.`, `Мысль вырастает из клеток ${ids.join(", ")}.`), "ok");
    },
  },
  {
    name: "claim",
    usage: "[cell]",
    help: { en: "shockwave as if a cell were claimed (visual only)", ru: "ударная волна, как при захвате клетки (только визуал)" },
    run: (a, env) => {
      const c = cellArg(env, a[0]);
      if (Number.isNaN(c)) return env.say(L(env, "No such cell. Use a number from 1 to 128.", "Нет такой клетки. Укажи число от 1 до 128."), "err");
      const free = env.nodes.filter((n) => n.status === "available");
      const id = c ?? pick(free.length ? free : env.nodes)?.id;
      if (id == null) return env.say("...", "err");
      env.inject({ nodeId: id, type: "claim" });
      env.say(L(env, `Shockwave from cell ${id}. Nothing was actually claimed.`, `Волна от клетки ${id}. На самом деле ничего не занято.`), "ok");
    },
  },
  {
    name: "tod",
    usage: "<dawn|day|dusk|night|auto>",
    help: { en: "set the time of day", ru: "задать время суток" },
    run: (a, env) => {
      const v = (a[0] ?? "").toLowerCase();
      if (!["dawn", "day", "dusk", "night", "auto"].includes(v)) return env.say(L(env, "Use: /tod dawn | day | dusk | night | auto", "Используй: /tod dawn | day | dusk | night | auto"), "err");
      todActions.set(v as TodMode);
      env.say(L(env, `Time of day: ${v}.`, `Время суток: ${v}.`), "ok");
    },
  },
  {
    name: "mood",
    usage: `<${MOODS.join("|")}|auto>`,
    help: { en: "change the eye's mood", ru: "сменить настроение глаза" },
    run: (a, env) => {
      const v = (a[0] ?? "").toLowerCase();
      if (v === "auto") {
        mindActions.force({ mood: null });
        return env.say(L(env, "Mood back to normal.", "Настроение вернулось."), "ok");
      }
      if (!(MOODS as readonly string[]).includes(v)) return env.say(L(env, `Moods: ${MOODS.join(", ")}, auto`, `Настроения: ${MOODS.join(", ")}, auto`), "err");
      mindActions.force({ mood: v });
      env.say(L(env, `The eye is ${v} now (a minute).`, `Глаз теперь: ${v} (на минуту).`), "ok");
    },
  },
  {
    name: "pet",
    usage: "<name|none>",
    help: { en: "switch your companion", ru: "сменить спутника" },
    run: (a, env) => {
      const v = (a[0] ?? "").toLowerCase();
      if (v === "none") {
        env.setPet(null);
        return env.say(L(env, "Companion put away.", "Спутник убран."), "ok");
      }
      const p = PETS.find((x) => x.id === v || x.name.en.toLowerCase() === v || x.name.ru.toLowerCase() === v);
      if (!p) return env.say(L(env, `Companions: ${PETS.map((x) => x.id).join(", ")}, none`, `Спутники: ${PETS.map((x) => x.id).join(", ")}, none`), "err");
      if (p.needs && !env.unlocked[p.needs]) return env.say(L(env, `${p.name.en} is locked: ${p.hint?.en}.`, `${p.name.ru} закрыт: ${p.hint?.ru}.`), "err");
      env.setPet(p.id);
      achActions.unlock("adopted");
      env.say(L(env, `${p.name.en} is with you now. Perk: ${p.perk.name.en}.`, `${p.name.ru} теперь с тобой. Перк: ${p.perk.name.ru}.`), "ok");
    },
  },
  {
    name: "meteor",
    help: { en: "a shower of shooting stars", ru: "звездопад" },
    run: (_a, env) => {
      skyActions.meteorShower(12);
      env.say(L(env, "Look at the sky.", "Смотри на небо."), "ok");
    },
  },
  { name: "clear", help: { en: "clear this screen", ru: "очистить экран" }, run: (_a, env) => env.clear() },

  // ---- secret ones: not in /help. Found by poking around; they earn a hidden achievement ----
  {
    name: "eye",
    secret: true,
    help: { en: "", ru: "" },
    run: (_a, env) => {
      mindActions.force({ mood: "restless" }, 3500);
      env.say(L(env, "* the eye winks *", "* глаз подмигивает *"), "info");
      achActions.unlock("secret-handshake");
    },
  },
  {
    name: "42",
    secret: true,
    help: { en: "", ru: "" },
    run: (_a, env) => {
      mindActions.force({ state: "thinking" }, 2600);
      env.say(L(env, "* the mind pauses for a long moment *", "* разум надолго замирает *"), "info");
      achActions.unlock("secret-handshake");
    },
  },
  {
    name: "hello",
    secret: true,
    help: { en: "", ru: "" },
    run: (_a, env) => {
      skyActions.pulse(1);
      env.say(L(env, "* the sky brightens for a second *", "* небо на секунду светлеет *"), "info");
      achActions.unlock("secret-handshake");
    },
  },
];

// Runs one line typed into the console. Returns false if it was empty.
export function runCommand(line: string, env: CmdEnv): boolean {
  const text = line.trim();
  if (!text) return false;
  const [head, ...args] = text.replace(/^\//, "").split(/\s+/);
  const cmd = COMMANDS.find((c) => c.name === head.toLowerCase());
  achActions.unlock("command-line");
  if (!cmd) {
    env.say(L(env, `Unknown command "${head}". Type /help.`, `Неизвестная команда «${head}». Набери /help.`), "err");
    return true;
  }
  cmd.run(args, env);
  return true;
}
