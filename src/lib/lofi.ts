"use client";

import { useCallback, useSyncExternalStore } from "react";

// Generative "cosmic lofi": everything is synthesised live with the Web Audio
// API (no audio files, nothing to license). A loose 4-chord loop in F major,
// swung drums, soft bass, a slow filter-breathing pad, twinkling pentatonic
// bells through a dark echo, and vinyl crackle.

const BPM = 74;
const BEAT = 60 / BPM;
const STEP = BEAT / 4; // 16th note
const SWING = 0.13; // fraction of a step that off-beat 16ths are pushed late
const PREF_KEY = "synnod-music";

const CHORDS: { root: number; notes: number[] }[] = [
  { root: 41, notes: [53, 57, 60, 64, 67] }, // Fmaj9-ish
  { root: 40, notes: [52, 55, 59, 62, 67] }, // Em7
  { root: 38, notes: [50, 53, 57, 60, 64] }, // Dm9
  { root: 36, notes: [48, 52, 55, 59, 62] }, // Cmaj9
];
const PENTA = [72, 74, 76, 79, 81, 84, 86]; // F-ish major pentatonic, high register

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class Engine {
  ctx!: AudioContext;
  master!: GainNode;
  padFilter!: BiquadFilterNode;
  echoSend!: GainNode;
  noise!: AudioBuffer;
  timer: number | null = null;
  nextTime = 0;
  step = 0;
  running = false;

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp).connect(ctx.destination);

    const tone = ctx.createBiquadFilter(); // warm, slightly dull "tape" top end
    tone.type = "lowpass";
    tone.frequency.value = 5200;
    tone.connect(this.master);

    // dark feedback echo, dotted-8th
    const delay = ctx.createDelay(2);
    delay.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain();
    fb.gain.value = 0.42;
    const echoTone = ctx.createBiquadFilter();
    echoTone.type = "lowpass";
    echoTone.frequency.value = 1700;
    delay.connect(echoTone).connect(fb).connect(delay);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    echoTone.connect(wet).connect(tone);
    this.echoSend = ctx.createGain();
    this.echoSend.gain.value = 1;
    this.echoSend.connect(delay);

    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.frequency.value = 1100;
    this.padFilter.Q.value = 0.6;
    this.padFilter.connect(tone);
    this.padFilter.connect(this.echoSend);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 420;
    lfo.connect(lfoGain).connect(this.padFilter.frequency);
    lfo.start();

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // constant faint hiss
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noise;
    hiss.loop = true;
    const hissF = ctx.createBiquadFilter();
    hissF.type = "highpass";
    hissF.frequency.value = 5000;
    const hissG = ctx.createGain();
    hissG.gain.value = 0.006;
    hiss.connect(hissF).connect(hissG).connect(this.master);
    hiss.start();

    this.tone = tone;
  }
  tone!: BiquadFilterNode;

  private env(g: GainNode, t: number, peak: number, attack: number, hold: number, release: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  }

  private tonal(type: OscillatorType, freq: number, t: number, peak: number, a: number, hold: number, r: number, dest: AudioNode, detune = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    const g = this.ctx.createGain();
    this.env(g, t, peak, a, hold, r);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + a + hold + r + 0.05);
  }

  private burst(t: number, dur: number, peak: number, filterType: BiquadFilterType, freq: number, dest: AudioNode, q = 0.7) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.02);
  }

  private kick(t: number, v: number) {
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.14);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.9 * v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.connect(g).connect(this.tone);
    o.start(t);
    o.stop(t + 0.4);
  }

  private schedule(step: number, t: number) {
    const inBar = step % 16;
    const bar = Math.floor(step / 16);
    const chord = CHORDS[bar % CHORDS.length];
    const swung = t + (inBar % 2 === 1 ? STEP * SWING : 0);

    if (inBar === 0) {
      const len = STEP * 16;
      for (const n of chord.notes) {
        this.tonal("triangle", mtof(n), t, 0.045, 0.5, len * 0.55, len * 0.7, this.padFilter, -7);
        this.tonal("triangle", mtof(n), t + 0.012, 0.04, 0.6, len * 0.55, len * 0.7, this.padFilter, 8);
      }
      // cosmic bells: a few random sparkles per bar
      const count = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const at = t + Math.floor(Math.random() * 14 + 1) * STEP;
        const note = PENTA[Math.floor(Math.random() * PENTA.length)];
        this.tonal("sine", mtof(note), at, 0.05 + Math.random() * 0.03, 0.006, 0.02, 1.9, this.tone);
        this.tonal("sine", mtof(note), at, 0.03, 0.006, 0.02, 1.9, this.echoSend);
        this.tonal("sine", mtof(note + 12), at, 0.012, 0.006, 0.01, 1.2, this.echoSend);
      }
    }

    // bass: root on 1, softer answer on the "and" of 3
    if (inBar === 0 || inBar === 10) {
      const f = mtof(chord.root);
      const v = inBar === 0 ? 0.3 : 0.2;
      this.tonal("sine", f, swung, v, 0.02, 0.35, 0.5, this.tone);
      this.tonal("triangle", f * 2, swung, v * 0.35, 0.02, 0.25, 0.4, this.tone);
    }

    // drums
    if (inBar === 0 || inBar === 7 || inBar === 10) this.kick(swung, inBar === 0 ? 1 : 0.65);
    if (inBar === 4 || inBar === 12) {
      this.burst(swung, 0.16, 0.22, "bandpass", 1900, this.tone, 0.9);
      this.tonal("triangle", 190, swung, 0.1, 0.002, 0.01, 0.1, this.tone);
    }
    if (inBar % 2 === 0) this.burst(swung, 0.045, 0.05 + (inBar % 4 === 0 ? 0.03 : 0), "highpass", 7000, this.tone);
    if (inBar === 14 && Math.random() < 0.5) this.burst(swung, 0.22, 0.05, "highpass", 6500, this.tone);

    // vinyl pops
    if (Math.random() < 0.22) this.burst(t + Math.random() * STEP, 0.006, 0.05 + Math.random() * 0.05, "highpass", 2500, this.master);
  }

  private tick = () => {
    while (this.nextTime < this.ctx.currentTime + 0.14) {
      this.schedule(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step++;
    }
  };

  async start() {
    if (this.running) return;
    if (!this.ctx) this.build();
    await this.ctx.resume();
    this.running = true;
    this.nextTime = this.ctx.currentTime + 0.1;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 3.5);
    this.timer = window.setInterval(this.tick, 30);
  }

  async stop() {
    if (!this.running) return;
    this.running = false;
    if (this.timer != null) window.clearInterval(this.timer);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.8);
    window.setTimeout(() => {
      if (!this.running) void this.ctx.suspend();
    }, 900);
  }
}

// ---- tiny external store so any component can show / flip the state ----

let engine: Engine | null = null;
let wanted = true; // default: music on (starts after the first click, browsers require a gesture)
let playing = false;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function loadPref() {
  if (loaded) return;
  loaded = true;
  try {
    wanted = window.localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    /* keep default */
  }
}

async function play() {
  engine ??= new Engine();
  await engine.start();
  playing = true;
  emit();
}

async function halt() {
  await engine?.stop();
  playing = false;
  emit();
}

export async function enterWithMusic(withMusic: boolean) {
  loadPref();
  wanted = withMusic;
  try {
    window.localStorage.setItem(PREF_KEY, withMusic ? "on" : "off");
  } catch {
    /* ignore */
  }
  if (withMusic) await play();
  else emit();
}

async function toggle() {
  loadPref();
  wanted = !playing;
  try {
    window.localStorage.setItem(PREF_KEY, wanted ? "on" : "off");
  } catch {
    /* ignore */
  }
  if (wanted) await play();
  else await halt();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!engine?.running) return;
    if (document.hidden) void engine.ctx.suspend();
    else void engine.ctx.resume();
  });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const snapshot = () => {
  loadPref();
  return `${wanted ? 1 : 0}${playing ? 1 : 0}`;
};

export function useMusic() {
  const s = useSyncExternalStore(subscribe, snapshot, () => "10");
  const flip = useCallback(() => void toggle(), []);
  return { wanted: s[0] === "1", playing: s[1] === "1", toggle: flip };
}
