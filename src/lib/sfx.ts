"use client";

import { soundWanted } from "./lofi";

// Tiny 8-bit interface sounds, synthesised on the fly. They follow the music
// switch: "sound on" plays them, "lofi off" silences them too.
let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined" || !soundWanted()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(c: AudioContext, freq: number, dur: number, type: OscillatorType, vol: number, at = 0, slideTo?: number) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const run = (fn: (c: AudioContext) => void) => () => {
  const c = ac();
  if (c) fn(c);
};

export const sfx = {
  select: run((c) => blip(c, 660, 0.06, "square", 0.04, 0, 990)),
  open: run((c) => {
    blip(c, 392, 0.07, "triangle", 0.05);
    blip(c, 587, 0.09, "triangle", 0.05, 0.06);
  }),
  reply: run((c) => {
    [523, 659, 784].forEach((f, i) => blip(c, f, 0.12, "triangle", 0.05, i * 0.07));
  }),
  claim: run((c) => {
    [392, 523, 659, 784, 1047].forEach((f, i) => blip(c, f, 0.16, "square", 0.035, i * 0.08));
    blip(c, 196, 0.5, "sine", 0.08, 0, 98);
  }),
  found: run((c) => {
    blip(c, 880, 0.05, "square", 0.035);
    blip(c, 1320, 0.08, "square", 0.035, 0.05);
  }),
  // one fanfare per rarity: the rarer, the longer and higher
  achieve: (tier: "bronze" | "silver" | "gold" | "legend") =>
    run((c) => {
      const notes = { bronze: [523, 659], silver: [523, 659, 784], gold: [523, 659, 784, 1047], legend: [392, 523, 659, 784, 1047, 1319] }[tier];
      notes.forEach((f, i) => blip(c, f, tier === "legend" ? 0.22 : 0.15, "square", 0.035, i * 0.085));
      if (tier === "gold" || tier === "legend") blip(c, 196, 0.6, "sine", 0.08, 0, 98);
      if (tier === "legend") notes.forEach((f, i) => blip(c, f * 2, 0.2, "triangle", 0.02, 0.5 + i * 0.07));
    })(),
  // one soft bell note (the /sing command)
  note: (freq: number) => run((c) => blip(c, freq, 0.32, "triangle", 0.06))(),
  miss: run((c) => blip(c, 220, 0.14, "sawtooth", 0.03, 0, 140)),
  tick: run((c) => blip(c, 1400 + Math.random() * 500, 0.018, "square", 0.012)),
};
