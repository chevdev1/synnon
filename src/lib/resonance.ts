// Resonance: two cells whose recent words echo each other (they share at least two
// distinctive words) get a slow golden thread between them on the brain. Only the shared
// words are ever shown, never anybody's text.
export interface Resonance {
  a: number;
  b: number;
  words: string[]; // up to 3 shared words
}

const STOP = new Set(
  ("this that with from have they them then than there their were what when where which would could should about into over just like very your yours mine also been being some more most much only other such these those will shall still even ever" +
    " это как так его она они оно там тут что чтобы для или если когда где как потом тоже очень был была были было быть есть этот эта эти того такой такая такие только просто может можно более всех свой своя свои моя мой мои твой").split(" "),
);

export const wordsOf = (text: string): Set<string> => {
  const out = new Set<string>();
  for (const w of text.toLowerCase().match(/[\p{L}]{4,}/gu) ?? []) if (!STOP.has(w)) out.add(w.slice(0, 24));
  return out;
};

// texts: what each cell said lately. Returns the strongest pairs, every cell at most once.
export function findResonance(byNode: Map<number, string[]>, max = 6): Resonance[] {
  const sets = [...byNode.entries()].map(([id, texts]) => ({ id, w: wordsOf(texts.join(" ")) }));
  const pairs: (Resonance & { score: number })[] = [];
  for (let i = 0; i < sets.length; i++)
    for (let j = i + 1; j < sets.length; j++) {
      const shared = [...sets[i].w].filter((w) => sets[j].w.has(w));
      if (shared.length >= 2) pairs.push({ a: sets[i].id, b: sets[j].id, words: shared.sort((x, y) => y.length - x.length).slice(0, 3), score: shared.length });
    }
  pairs.sort((x, y) => y.score - x.score || x.a - y.a);
  const used = new Set<number>();
  const out: Resonance[] = [];
  for (const p of pairs) {
    if (used.has(p.a) || used.has(p.b)) continue;
    used.add(p.a);
    used.add(p.b);
    out.push({ a: p.a, b: p.b, words: p.words });
    if (out.length >= max) break;
  }
  return out;
}

// Simulated pairs for the demo (labelled as such in the interface).
export function demoResonance(takenIds: number[]): Resonance[] {
  const ids = [...takenIds].sort((x, y) => x - y);
  const WORDS = [["bridge", "color"], ["rain", "window"], ["kitchen", "light"], ["train", "night"]];
  const out: Resonance[] = [];
  for (let k = 0; k < WORDS.length && ids.length > 2 * k + 8; k++) {
    const a = ids[(k * 7 + 1) % ids.length];
    const b = ids[(k * 11 + 5) % ids.length];
    if (a !== b && !out.some((o) => o.a === a || o.b === a || o.a === b || o.b === b)) out.push({ a, b, words: WORDS[k] });
  }
  return out;
}
