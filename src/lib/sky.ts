// Tiny shared state for the page-wide sky. The landing page feeds it (the mind is
// asleep, something just happened); the sky reads it every frame, so any page
// can show the sky without needing the live data provider.
export type Weather = "clear" | "rain" | "snow" | "storm";
export const sky = { dreaming: false, swell: 0, swellAt: 0, poke: 0, meteors: 0, danceUntil: 0, goalTier: 0, weather: "clear" as Weather, boltSeq: 0 };

export const skyActions = {
  setDreaming(v: boolean) {
    sky.dreaming = v;
  },
  // a keystroke in the chat (the blob companion bounces on it)
  poke() {
    sky.poke += 1;
  },
  // the companion dances for a while (the /dance command)
  dance(ms = 5000) {
    sky.danceUntil = performance.now() + ms;
  },
  // a burst of shooting stars (the /meteor command)
  meteorShower(n = 8) {
    sky.meteors += n;
  },
  // strength 0..1; a claim swells the sky the most
  pulse(strength: number) {
    sky.swell = strength;
    sky.swellAt = performance.now();
  },
};
