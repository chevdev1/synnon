"use client";

import { useSyncExternalStore } from "react";
import { sky } from "@/lib/sky";

// One click to switch the weather (rain, snow, storms, the season's visitors, fireworks)
// off for yourself, and one click to bring it back. Remembered in this browser.
// Canvases read sky.weatherOff every frame, so no component needs to re-render for it.
const KEY = "synnod-weather";
const listeners = new Set<() => void>();
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    sky.weatherOff = window.localStorage.getItem(KEY) === "off";
  } catch {
    /* storage blocked: weather stays on */
  }
}

export function loadWeatherPref() {
  load();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useWeatherOn = () =>
  useSyncExternalStore(
    subscribe,
    () => {
      load();
      return !sky.weatherOff;
    },
    () => true
  );

export const weatherPrefActions = {
  toggle() {
    load();
    sky.weatherOff = !sky.weatherOff;
    try {
      window.localStorage.setItem(KEY, sky.weatherOff ? "off" : "on");
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  },
};
