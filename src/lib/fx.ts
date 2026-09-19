"use client";

// Short screen effects for the console (/glitch, /matrix, /spin...). One at a time:
// html[data-fx="<name>"] switches the CSS in globals.css on, and it clears itself.
export type Fx = "glitch" | "matrix" | "spin" | "heartbeat" | "rainbow" | "void";

let timer: number | undefined;

export const fxActions = {
  run(name: Fx, ms: number) {
    document.documentElement.dataset.fx = name;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      delete document.documentElement.dataset.fx;
    }, ms);
  },
  stop() {
    window.clearTimeout(timer);
    delete document.documentElement.dataset.fx;
  },
};
