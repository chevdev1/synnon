// Dreams of the mind. Each night it replays a few old memories, cut and shuffled by the
// date. Nothing is invented: every line is a piece of something the mind really said
// (replies are public), shown with the cell it came from. The same day always gives the
// same dream.
export interface DreamFragment {
  nodeId: number | null;
  text: string;
}
export interface Dream {
  day: string;
  fragments: DreamFragment[];
}

export const dayHash = (day: string) => {
  let h = 2166136261;
  for (const ch of day) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};
const rng = (seed: number) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};

// a short piece of a reply: the first sentence, or its first words
export function cutFragment(text: string): string {
  const one = text.replace(/\s+/g, " ").trim();
  const sentence = one.match(/^.{12,}?[.!?…](?=\s|$)/)?.[0] ?? one;
  return sentence.length <= 96 ? sentence : sentence.slice(0, 93).replace(/\s+\S*$/, "") + "…";
}

export function pickDream(day: string, pool: { nodeId: number | null; text: string }[], count = 4): Dream {
  const rand = rng(dayHash(day));
  const bag = [...pool];
  const fragments: DreamFragment[] = [];
  while (fragments.length < count && bag.length > 0) {
    const [row] = bag.splice(Math.floor(rand() * bag.length), 1);
    const text = cutFragment(row.text);
    if (text.length >= 8) fragments.push({ nodeId: row.nodeId, text });
  }
  return { day, fragments };
}

const DEMO_POOL = [
  { nodeId: 7, text: "Rain that fell upward for a second. I kept it." },
  { nodeId: 17, text: "A city built entirely from doors. I am not sure which one is mine." },
  { nodeId: 24, text: "Two people, same city, different color of the same afternoon." },
  { nodeId: 12, text: "A lake that hums at night, and nobody minds." },
  { nodeId: 31, text: "A street that smells of wet stone for exactly one minute." },
  { nodeId: 40, text: "Bread and clocks. The bakery turns on its lights at four." },
];
export const demoDream = (day: string): Dream => pickDream(day, DEMO_POOL, 4);
