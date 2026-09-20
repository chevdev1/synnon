import { petPalette } from "@/lib/pets";

// The companion's movement and drawing, kept out of the brain canvas. Each pet has one
// perk (see PETS in pets.ts). Everything here is cosmetic: no perk changes real data.
export interface CellPx {
  id: number;
  x: number; // canvas px
  y: number;
  R: number; // canvas px
}

export interface PetEnv {
  mine: CellPx | null;
  cells: CellPx[]; // every claimable cell
  isTaken: (id: number) => boolean;
  dreaming: boolean;
  reduced: boolean;
  pointer: { x: number; y: number } | null; // canvas px
  poke: number; // counter that ticks on every keystroke in the chat
  dancing: boolean; // the /dance command
  streak: number; // days in a row (the Ember's flame)
  font: string;
  width: number;
  height: number;
}

interface Target {
  x: number;
  y: number;
  r: number; // orbit radius around it
  until: number; // -1 = stamp on the next frame
  ms: number;
  label?: string;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class PetSim {
  x = 0;
  y = 0;
  placed = false;
  trail: [number, number][] = [];
  hopAt = -1e9;
  target: Target | null = null;
  lastPoke = -1;
  nextEvent = 6000; // ghost visits / comet whooshes
  pal: Record<string, string>;
  stage = 0; // evolution: 0 hatchling, 1 grown, 2 elder, 3 legend (see petBond.ts)
  burstAt = -1e15; // when it last evolved (a ring of light)
  burstPending = false; // evolved just now: stamp the time on the next frame

  constructor(
    public id: string,
    public rows: string[],
    public color: string
  ) {
    this.pal = petPalette(color);
  }

  // The bond grew: a bigger, fancier companion, announced with a burst of light.
  setStage(n: number) {
    if (n > this.stage && this.placed) this.burstPending = true;
    this.stage = n;
  }

  hop(t: number) {
    this.hopAt = t;
  }

  // Someone else's cell spoke: the moth flies over to have a look.
  notePulse(cell: CellPx, own: boolean) {
    if (own) {
      this.hopAt = -1;
      return;
    }
    if (this.id === "moth") this.target = { x: cell.x, y: cell.y, r: cell.R * 1.7, until: -1, ms: 3200 };
  }

  draw(ctx: CanvasRenderingContext2D, t: number, env: PetEnv) {
    const { mine } = env;
    if (!mine) return;
    if (this.hopAt === -1) this.hopAt = t;
    if (!this.placed) {
      this.x = mine.x + mine.R * 2.5;
      this.y = mine.y;
      this.placed = true;
    }
    const asleep = env.dreaming;

    // ---- keystrokes: the blob bounces on every letter you type ----
    if (this.lastPoke < 0) this.lastPoke = env.poke;
    if (env.poke !== this.lastPoke) {
      this.lastPoke = env.poke;
      if (this.id === "blob") this.hopAt = t;
    }

    // ---- scheduled events ----
    if (this.target && this.target.until === -1) this.target.until = t + this.target.ms;
    if (this.target && t > this.target.until) this.target = null;
    if (!asleep && !env.reduced && t > this.nextEvent) {
      if (this.id === "ghost") {
        const pool = env.cells.filter((c) => c.id !== mine.id && env.isTaken(c.id));
        if (pool.length) {
          const c = pool[Math.floor(Math.random() * pool.length)];
          this.target = { x: c.x, y: c.y - c.R * 1.4, r: 2, until: t + 3200, ms: 3200, label: `NODE ${String(c.id).padStart(2, "0")}` };
        }
        this.nextEvent = t + 16000 + Math.random() * 8000;
      } else if (this.id === "comet") {
        const c = env.cells[Math.floor(Math.random() * env.cells.length)];
        if (c) this.target = { x: c.x, y: c.y, r: c.R * 2, until: t + 1100, ms: 1100 };
        this.nextEvent = t + 12000 + Math.random() * 6000;
      } else this.nextEvent = Infinity;
    }

    // ---- /dance: a fast wide loop with a hop every beat ----
    const dancing = env.dancing && !asleep;
    if (dancing && t - this.hopAt > 380) this.hopAt = t;

    // ---- where it wants to be ----
    const hopAge = this.hopAt >= 0 ? (t - this.hopAt) / 700 : 2;
    const hop = hopAge < 1 ? Math.sin(Math.PI * hopAge) : 0;
    const anchor = this.target && !asleep && !dancing ? this.target : { x: mine.x, y: mine.y, r: mine.R * (asleep ? 1.9 : (dancing ? 3.4 : 2.5) + hop * 1.4 + Math.sin(t / 700) * 0.25) };
    const a = asleep || env.reduced ? 0.9 : t / (dancing ? 260 : this.id === "comet" ? 700 : 1500);
    const wantX = anchor.x + Math.cos(a) * anchor.r;
    const wantY = anchor.y + Math.sin(a) * anchor.r * 0.7 - hop * 5 + (asleep ? Math.sin(t / 900) * 0.8 : Math.sin(t / 240) * 1.2);
    const ease = env.reduced ? 1 : this.id === "comet" ? 0.3 : this.id === "moth" ? 0.07 : 0.14;
    this.x += (wantX - this.x) * ease;
    this.y += (wantY - this.y) * ease;

    // ---- perk visuals under the sprite ----
    if (this.id === "firefly") {
      // a warm night-light around your cell, brightest while the mind sleeps
      const k = asleep ? 0.3 : 0.13 + 0.05 * Math.sin(t / 900);
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(mine.x, mine.y, 0, mine.x, mine.y, mine.R * 3.4);
      g.addColorStop(0, `rgba(196,242,96,${k})`);
      g.addColorStop(1, "rgba(196,242,96,0)");
      ctx.fillStyle = g;
      ctx.fillRect(mine.x - mine.R * 4, mine.y - mine.R * 4, mine.R * 8, mine.R * 8);
      ctx.globalCompositeOperation = "source-over";
    }

    // Ember: the flame around it grows with your daily streak (up to 30 days)
    if (this.id === "ember") {
      const r = 14 + Math.min(env.streak, 30) * 0.9 + Math.sin(t / 180) * 1.2;
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r);
      g.addColorStop(0, "rgba(255,150,70,0.4)");
      g.addColorStop(1, "rgba(255,150,70,0)");
      ctx.fillStyle = g;
      ctx.fillRect(this.x - r, this.y - r, r * 2, r * 2);
      ctx.globalCompositeOperation = "source-over";
    }

    // ---- trail ----
    const trailLen = (this.id === "comet" ? 12 : 5) + this.stage * 2;
    const S = this.stage >= 2 ? 3 : 2; // sprite pixel size: elders and legends are bigger
    this.trail.push([this.x, this.y]);
    if (this.trail.length > trailLen + 1) this.trail.shift();
    if (!asleep && !env.reduced) {
      this.trail.forEach(([tx, ty], i) => {
        ctx.globalAlpha = (0.5 * i) / trailLen;
        ctx.fillStyle = this.color;
        const s = this.id === "comet" ? 3 : 2;
        ctx.fillRect(Math.round(tx) - 1, Math.round(ty) - 1, s, s);
      });
      ctx.globalAlpha = 1;
    }

    // ---- glow + sprite ----
    const px = Math.round(this.x);
    const py = Math.round(this.y);
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(px, py, 0, px, py, 12 + this.stage * 3 + hop * 6 + (this.id === "comet" ? 4 : 0));
    glow.addColorStop(0, `${this.color}55`);
    glow.addColorStop(1, `${this.color}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(px - 22, py - 22, 44, 44);
    ctx.globalCompositeOperation = "source-over";

    // the eyebit's pupil looks at the mouse
    let ex = 0;
    let ey = 0;
    if (this.id === "eyebit" && env.pointer && !asleep) {
      const dx = env.pointer.x - this.x;
      const dy = env.pointer.y - this.y;
      ex = clamp(Math.round(dx / 24), -1, 1);
      ey = clamp(Math.round(dy / 24), -1, 1);
    }
    const blink = !asleep && Math.floor(t / 2600) % 3 === 0 && t % 2600 < 140;
    if (this.id === "ghost") ctx.globalAlpha = 0.85;
    this.rows.forEach((row, ry) =>
      [...row].forEach((ch, rx) => {
        if (ch === ".") return;
        let c = this.pal[ch];
        if (ch === "x" && this.id === "eyebit") c = this.pal["o"]; // pupil is drawn shifted below
        if (blink && ch === "x") c = this.pal["#"];
        ctx.fillStyle = c;
        ctx.fillRect(px + (rx - 3) * S, py + (ry - 3) * S, S, S);
      })
    );
    ctx.globalAlpha = 1;
    if (this.id === "eyebit") {
      ctx.fillStyle = blink ? this.pal["#"] : this.pal["x"];
      for (const rx of [2, 3, 4]) ctx.fillRect(px + (rx + ex - 3) * S, py + (3 + ey - 3) * S, S, S);
    }

    // ---- evolution: sparkles (grown), a crown (elder), a rainbow halo with orbiting sparks (legend) ----
    if (this.stage >= 1 && !asleep) {
      ctx.fillStyle = this.pal["o"];
      for (let k = 0; k < 2; k++) {
        const ph = ((t / 1400 + k * 0.5) % 1);
        ctx.globalAlpha = Math.sin(Math.PI * ph);
        const a = k * 2.4 + Math.floor(t / 1400 + k * 0.5) * 1.3;
        ctx.fillRect(Math.round(px + Math.cos(a) * (8 * S / 2 + 4)), Math.round(py + Math.sin(a) * (8 * S / 2 + 4) - 2), 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (this.stage >= 2) {
      const top = py - 4 * S - 3;
      ctx.fillStyle = "#ffd166";
      for (const dx of [-4, 0, 4]) ctx.fillRect(px + dx - 1, top - 2, 2, 2);
      ctx.fillRect(px - 5, top, 11, 2);
    }
    if (this.stage >= 3 && !asleep) {
      const hue = Math.round((t / 18) % 360);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `hsla(${hue},90%,65%,0.55)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(px, py, 15, 11, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 3; k++) {
        const a = t / 700 + (k * Math.PI * 2) / 3;
        ctx.fillStyle = `hsla(${(hue + k * 90) % 360},95%,72%,0.9)`;
        ctx.fillRect(Math.round(px + Math.cos(a) * 15), Math.round(py + Math.sin(a) * 11), 2, 2);
      }
      ctx.globalCompositeOperation = "source-over";
    }
    if (this.burstPending) {
      this.burstPending = false;
      this.burstAt = t;
    }
    if (t - this.burstAt >= 0 && t - this.burstAt < 1300) {
      const p = (t - this.burstAt) / 1300;
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,235,170,${(0.8 * (1 - p)).toFixed(3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 6 + p * 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }

    // ghost label: whose voice it is haunting
    if (this.target?.label && !asleep) {
      ctx.font = `7px ${env.font}`;
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "rgba(8,10,32,0.85)";
      const w = ctx.measureText(this.target.label).width + 6;
      ctx.fillRect(px - w / 2, py - 15, w, 10);
      ctx.fillStyle = this.color;
      ctx.fillText(this.target.label, px - w / 2 + 3, py - 6);
    }

    if (asleep) {
      ctx.fillStyle = "#b9a6f5";
      const z = (t / 900) % 1;
      const zy = py - 10 - z * 6;
      ctx.globalAlpha = 1 - z;
      ctx.fillRect(px + 6, Math.round(zy), 3, 1);
      ctx.fillRect(px + 8, Math.round(zy) + 1, 1, 1);
      ctx.fillRect(px + 6, Math.round(zy) + 2, 3, 1);
      ctx.globalAlpha = 1;
    }
  }
}
