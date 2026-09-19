// Tiny shared state for the page-wide sky. The landing page feeds it (the mind is
// asleep, something just happened); the sky reads it every frame, so any page
// can show the sky without needing the live data provider.
export const sky = { dreaming: false, swell: 0, swellAt: 0 };

export const skyActions = {
  setDreaming(v: boolean) {
    sky.dreaming = v;
  },
  // strength 0..1; a claim swells the sky the most
  pulse(strength: number) {
    sky.swell = strength;
    sky.swellAt = performance.now();
  },
};
