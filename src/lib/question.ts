// Question of the week: once a week the mind asks all its voices one question. Answers
// (short, moderated, no names) light up cells in a mosaic shaped like the brain, and the
// mind writes down, in its own words, what it heard.
export const MAX_ANSWER = 140;

export interface QAnswer {
  id: number;
  nodeId: number;
  text: string;
  ts: number;
}

export interface QState {
  question: { id: number; week: string; text: string; source: "mind" | "pool" };
  answers: QAnswer[]; // approved only, newest first
  cells: number; // claimed cells (the mosaic's "out of")
  mine: null | { status: "approved" | "pending" }; // this visitor's answer, if any
  synthesis: string | null;
}

// ISO week in UTC, e.g. "2026-W38".
export function weekId(d = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86_400_000 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

// Written by people (not generated), used when the mind can't come up with one itself.
export const QUESTION_POOL = [
  "What sound makes you feel at home?",
  "Which smell takes you back to being small?",
  "What do you do on the way home that no one knows about?",
  "Which place do you go back to in your head?",
  "What is the last thing you noticed today that nobody else did?",
  "What colour is your kitchen at night?",
  "Which word do you like the sound of?",
  "What would you keep if the city forgot everything else?",
  "Where does it go quiet in your town?",
  "What do you always misremember?",
  "Which small ritual holds your morning together?",
  "What was the weather like in your favourite memory?",
  "What do you hear when it is almost silent?",
  "Which street would you draw from memory?",
  "What would you tell a stranger about the light where you live?",
  "What is a thing you only see at night?",
];

export function poolQuestion(week: string): string {
  let h = 0;
  for (const ch of week) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return QUESTION_POOL[h % QUESTION_POOL.length];
}

const DEMO_ANSWERS = [
  "the fridge humming at 3 a.m.",
  "rain on a tin roof",
  "a kettle almost boiling",
  "my grandmother's radio, slightly out of tune",
  "the last tram going past",
  "snow squeaking under boots",
  "waves that never quite arrive",
  "a neighbour's piano, one wrong note",
  "bread bags rustling",
  "wind in the stairwell",
  "the lift that always sighs",
  "cicadas, then suddenly nothing",
  "keys in a bowl",
  "a train two valleys away",
  "someone laughing in another flat",
  "ice cracking on the lake",
  "the tap dripping in E flat",
  "pages turning in an empty library",
  "bicycle chains ticking",
  "the sea in a shell, but it's the fridge",
  "a dog dreaming loudly",
  "rain, but far away",
  "the clock nobody winds",
  "footsteps on gravel, slowing down",
  "the hush just after the fireworks",
  "soft static between two stations",
  "a door closing gently in the next room",
  "tea being stirred",
  "the city breathing out at dawn",
  "old floorboards saying goodnight",
];

// A simulated week for the demo (clearly marked in the UI).
export function demoQuestion(now: number, cellIds: number[]): QState {
  const week = weekId(new Date(now));
  const ids = cellIds.filter((_, i) => i % 3 !== 1).slice(0, DEMO_ANSWERS.length);
  return {
    question: { id: 1, week, text: poolQuestion(week), source: "pool" },
    answers: ids.map((nodeId, i) => ({ id: i + 1, nodeId, text: DEMO_ANSWERS[i % DEMO_ANSWERS.length], ts: now - (i + 1) * 47 * 60_000 })).reverse(),
    cells: cellIds.length,
    mine: null,
    synthesis:
      "Many of you named sounds that are almost silence: things that hum, drip and settle. I noticed most of them happen when nobody is watching. I am keeping the smallest ones.",
  };
}
