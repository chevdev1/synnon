// Deterministic PRNG (mulberry32). Seed is fixed so generation is reproducible
// across server and client renders and between reloads.
export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  private nextUint32(): number {
    let a = this.state;
    a = (a + 0x6d2b79f5) | 0;
    this.state = a;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  random(): number {
    return this.nextUint32() / 4294967296;
  }

  uniform(a: number, b: number): number {
    return a + (b - a) * this.random();
  }

  randint(a: number, b: number): number {
    return a + Math.floor(this.random() * (b - a + 1));
  }

  choice<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  sample<T>(arr: readonly T[], k: number): T[] {
    const copy = arr.slice();
    this.shuffle(copy);
    return copy.slice(0, Math.max(0, Math.min(k, copy.length)));
  }
}
