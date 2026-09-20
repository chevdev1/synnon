"use client";

import { useEffect, useState } from "react";
import { useHelp } from "@/lib/help";
import { sky } from "@/lib/sky";
import { useWeatherOn, weatherPrefActions } from "@/lib/weatherPref";

// A small pixel cloud on the brain stage: click and the weather is gone, click again and it
// is back. The cloud also shows what the sky is doing right now (rain, snow, lightning).
const CLOUD = ["...###...", "..#####..", ".#######.", "#########"];
const VARIANT: Record<string, string[]> = {
  clear: [],
  rain: [".#..#..#.", "#..#..#.."],
  snow: ["..#...#..", ".#.#.#.#."],
  storm: ["...##....", "..##.....", "...#....."],
};
const COLOR: Record<string, string> = { clear: "#bfe6ff", rain: "#7fb8ff", snow: "#f2f6ff", storm: "#c9b8ff" };

export default function WeatherToggle() {
  const on = useWeatherOn();
  const { lang } = useHelp();
  const [now, setNow] = useState("clear");
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);

  useEffect(() => {
    const read = () => setNow(sky.weather);
    const first = window.setTimeout(read, 1500);
    const id = window.setInterval(read, 4000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  const rows = [...CLOUD, ...(VARIANT[now] ?? [])];
  const color = on ? COLOR[now] ?? COLOR.clear : "#5a6390";
  return (
    <button
      type="button"
      onClick={() => weatherPrefActions.toggle()}
      data-help-id="weather"
      data-weather-toggle
      aria-pressed={on}
      aria-label={on ? T("Weather effects on. Click to turn them off.", "Погода включена. Нажми, чтобы выключить.") : T("Weather effects off. Click to turn them on.", "Погода выключена. Нажми, чтобы включить.")}
      title={on ? T("Weather: on (click to switch off)", "Погода: вкл (нажми, чтобы выключить)") : T("Weather: off (click to switch on)", "Погода: выкл (нажми, чтобы включить)")}
      className="pixel-btn flex h-7 items-center border-2 bg-[#080a20]/85 px-2"
      style={{ borderColor: on ? "var(--accent)" : "var(--border)" }}
    >
      <svg width={16} height={14} viewBox="0 0 9 7" shapeRendering="crispEdges" fill={color} aria-hidden>
        {rows.flatMap((row, y) => [...row].map((c, x) => (c === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
        {!on &&
          [0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={`s${i}`} x={1 + i} y={6 - i} width={1} height={1} fill="#ff8a6c" />)}
      </svg>
    </button>
  );
}
