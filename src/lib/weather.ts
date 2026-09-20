// The sky follows the calendar and the clock, the same for every visitor: nobody calls
// the weather, people just happen to see it. Weather comes in fixed time slots (biased by
// the season) and each season, plus a few dates in the year, bring their own visitors.
import type { Weather } from "@/lib/sky";

export type Season = "winter" | "spring" | "summer" | "autumn";
export type Visitor = "leaf" | "petal" | "firefly" | null;

const SLOT_MS = 9 * 60_000;
// chance per slot of [rain, snow, storm]
const CHANCE: Record<Season, [number, number, number]> = {
  winter: [0.06, 0.34, 0.02],
  spring: [0.2, 0.01, 0.05],
  summer: [0.06, 0, 0.14],
  autumn: [0.24, 0, 0.08],
};

const h32 = (n: number) => {
  let x = n | 0;
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
  return (x ^ (x >>> 16)) >>> 0;
};

export const seasonOf = (d: Date): Season => {
  const m = d.getMonth(); // 0 = January
  return m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn";
};

// The schedule uses the UTC season so the server, the diary and every visitor agree.
export const seasonOfUTC = (d: Date): Season => {
  const m = d.getUTCMonth();
  return m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn";
};

export function weatherAt(ms: number, season: Season): Weather {
  const r = (h32(Math.floor(ms / SLOT_MS)) % 10000) / 10000;
  const [rain, snow, storm] = CHANCE[season];
  if (r < rain) return "rain";
  if (r < rain + snow) return "snow";
  if (r < rain + snow + storm) return "storm";
  return "clear";
}

export interface CalendarSky {
  season: Season;
  weather: Weather;
  visitor: Visitor; // the season's ambient visitor
  shower: boolean; // a real meteor shower night (Perseids, Leonids, Geminids)
  newYear: boolean; // fireworks
}

// `test` only works outside production (?skytest=storm|snow|rain|leaf|petal|firefly|shower|fireworks)
export function calendarSky(d: Date, test: string | null = null): CalendarSky {
  let season = seasonOf(d);
  const m = d.getMonth();
  const day = d.getDate();
  let weather = weatherAt(d.getTime(), seasonOfUTC(d));
  let shower = (m === 7 && day >= 10 && day <= 14) || (m === 10 && day >= 16 && day <= 18) || (m === 11 && day >= 12 && day <= 15);
  let newYear = (m === 11 && day === 31) || (m === 0 && day === 1);
  if (test) {
    if (test === "rain" || test === "snow" || test === "storm") weather = test;
    if (test === "leaf") season = "autumn";
    if (test === "petal") season = "spring";
    if (test === "firefly") season = "summer";
    if (test === "shower") shower = true;
    if (test === "fireworks") newYear = true;
  }
  const visitor: Visitor = season === "autumn" ? "leaf" : season === "spring" ? "petal" : season === "summer" ? "firefly" : null;
  return { season, weather, visitor, shower, newYear };
}

// The sky has followed this schedule since the day weather arrived; earlier days had none.
export const WEATHER_SINCE = "2026-09-20";
export interface SkyEvent {
  w: Exclude<Weather, "clear">;
  from: number; // ms
  to: number;
}

// What the sky did on a UTC day, worked out from the schedule (nothing is stored).
export function skyEventsForDay(day: string, ignoreSince = false): SkyEvent[] {
  const start = Date.parse(day + "T00:00:00Z");
  if (Number.isNaN(start) || (!ignoreSince && day < WEATHER_SINCE)) return [];
  const season = seasonOfUTC(new Date(start));
  const out: SkyEvent[] = [];
  for (let t = start; t < start + 86_400_000; t += SLOT_MS) {
    const w = weatherAt(t, season);
    if (w === "clear") continue;
    const last = out[out.length - 1];
    if (last && last.w === w && last.to === t) last.to = t + SLOT_MS;
    else out.push({ w, from: t, to: t + SLOT_MS });
  }
  return out;
}
