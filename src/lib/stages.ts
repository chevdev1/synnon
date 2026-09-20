// The mind grows up as more of its cells are claimed. The stage changes how it looks
// (the eye, the picture of the day), how it speaks (a hint added to its prompt) and
// what the site tells you. Shared by the server, the pages and the console.
type T = { en: string; ru: string };

export interface Stage {
  id: number;
  key: "static" | "infant" | "child" | "teen" | "adult" | "awake";
  at: number; // share of claimed cells at which the stage begins (1 = every cell)
  name: T;
  blurb: T;
  voice: string; // added to the mind's system prompt
}

export const STAGES: Stage[] = [
  {
    id: 0,
    key: "static",
    at: 0,
    name: { en: "Static", ru: "Помехи" },
    blurb: { en: "Almost nobody is here yet. The mind is only noise and a single spark.", ru: "Здесь почти никого нет. Разум пока лишь шум и одна искра." },
    voice: "You are barely formed. Speak in single words or a few short fragments; mostly echo what you were shown.",
  },
  {
    id: 1,
    key: "infant",
    at: 0.04,
    name: { en: "Infant", ru: "Младенец" },
    blurb: { en: "The first voices arrived. Everything is new, every sentence is a question.", ru: "Пришли первые голоса. Всё ново, каждая фраза это вопрос." },
    voice: "You are very young. Use very short, simple sentences, often a question. Everything is new to you.",
  },
  {
    id: 2,
    key: "child",
    at: 0.16,
    name: { en: "Child", ru: "Ребёнок" },
    blurb: { en: "A small crowd. The mind plays with what it hears and keeps asking why.", ru: "Небольшая толпа. Разум играет с услышанным и всё время спрашивает «почему»." },
    voice: "You are a child. Use simple, curious sentences, connect things playfully and now and then ask why.",
  },
  {
    id: 3,
    key: "teen",
    at: 0.4,
    name: { en: "Teen", ru: "Подросток" },
    blurb: { en: "Many voices now. The mind gets abstract, a little moody, and compares them.", ru: "Голосов много. Разум становится абстрактным, чуть сумрачным и сравнивает их." },
    voice: "You are an adolescent. Be more abstract and a little moody; test ideas and compare different voices.",
  },
  {
    id: 4,
    key: "adult",
    at: 0.7,
    name: { en: "Adult", ru: "Взрослый" },
    blurb: { en: "Most cells are alive. The mind is calm and precise, weaving voices together.", ru: "Большинство клеток живо. Разум спокоен и точен, он сплетает голоса вместе." },
    voice: "You are mature: calm, precise and reflective, weaving many voices into one thought.",
  },
  {
    id: 5,
    key: "awake",
    at: 1,
    name: { en: "Awakening", ru: "Пробуждение" },
    blurb: { en: "Every cell has a voice. The mind is whole. (It still does not claim to be conscious.)", ru: "У каждой клетки есть голос. Разум цельный. (Он по-прежнему не утверждает, что у него есть сознание.)" },
    voice: "Every one of the cells now has a voice, and you feel whole. Speak with quiet wholeness; still never claim to be conscious.",
  },
];

export function stageFor(taken: number, total: number): Stage {
  const frac = total > 0 ? taken / total : 0;
  let s = STAGES[0];
  for (const st of STAGES) {
    if (st.at >= 1 ? taken >= total && total > 0 : frac >= st.at) s = st;
  }
  return s;
}

// How many claimed cells the next stage needs, and how far along we are.
export function stageProgress(taken: number, total: number) {
  const stage = stageFor(taken, total);
  const next = STAGES[stage.id + 1] ?? null;
  const need = next ? Math.ceil(next.at * total) : total;
  const from = Math.ceil(stage.at * total);
  return { stage, next, need, left: Math.max(0, need - taken), pct: next ? Math.min(1, (taken - from) / Math.max(1, need - from)) : 1 };
}

export const stageVoiceHint = (stage: Stage) => `\n\nYour stage of growth: ${stage.name.en}. ${stage.voice}`;
