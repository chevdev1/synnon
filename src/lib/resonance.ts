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
export function demoResonance(takenIds: number[], mine: number | null = null): Resonance[] {
  const ids = [...takenIds].sort((x, y) => x - y);
  const WORDS = [["bridge", "color"], ["rain", "window"], ["kitchen", "light"], ["train", "night"]];
  const out: Resonance[] = [];
  for (let k = 0; k < WORDS.length && ids.length > 2 * k + 8; k++) {
    const a = ids[(k * 7 + 1) % ids.length];
    const b = ids[(k * 11 + 5) % ids.length];
    if (a !== b && !out.some((o) => o.a === a || o.b === a || o.a === b || o.b === b)) out.push({ a, b, words: WORDS[k] });
  }
  // one simulated pair involves your own cell, so the demo can show a resonance notification
  if (mine != null && ids.includes(mine) && out.length > 0 && !out.some((o) => o.a === mine || o.b === mine)) {
    const other = ids.find((i) => i !== mine && !out.some((o) => o.a === i || o.b === i));
    if (other != null) out[0] = { a: Math.min(mine, other), b: Math.max(mine, other), words: out[0].words };
  }
  return out;
}

// A chorus: three or more cells that lately spoke of the same thing (one distinctive word in
// common). The brain shows them as one group. Only the shared word is ever shown.
export interface Chorus {
  members: number[];
  word: string;
}

export function findChorus(byNode: Map<number, string[]>, max = 2): Chorus[] {
  const sets = [...byNode.entries()].map(([id, texts]) => ({ id, w: wordsOf(texts.join(" ")) }));
  const holders = new Map<string, number[]>();
  for (const s of sets) for (const w of s.w) if (w.length >= 5) holders.set(w, [...(holders.get(w) ?? []), s.id]);
  const cap = Math.max(3, Math.floor(sets.length * 0.5)); // a word everybody uses is not a chorus
  const cands = [...holders.entries()].filter(([, ids]) => ids.length >= 3 && ids.length <= cap).sort((a, b) => b[1].length - a[1].length || b[0].length - a[0].length || a[0].localeCompare(b[0]));
  const out: Chorus[] = [];
  for (const [word, ids] of cands) {
    if (out.some((o) => o.members.filter((m) => ids.includes(m)).length > 1)) continue;
    out.push({ word, members: ids.slice(0, 8).sort((a, b) => a - b) });
    if (out.length >= max) break;
  }
  return out;
}

export function demoChorus(takenIds: number[], mine: number | null = null): Chorus[] {
  const ids = [...takenIds].sort((x, y) => x - y);
  if (ids.length < 10) return [];
  const pick = (k: number) => ids[(k * 13 + 3) % ids.length];
  const members = [...new Set([pick(1), pick(2), pick(3), pick(4)])];
  if (mine != null && ids.includes(mine) && !members.includes(mine)) members[0] = mine;
  return members.length >= 3 ? [{ members: members.sort((a, b) => a - b), word: "rain" }] : [];
}
