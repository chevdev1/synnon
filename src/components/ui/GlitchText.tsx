"use client";

import { useEffect, useRef, useState } from "react";
import { mindActions } from "@/lib/mind";
import { useMotion } from "@/lib/motion";
import { sfx } from "@/lib/sfx";

const NOISE = "░▒▓#%&@*+=";
const HEAD = 3; // characters just ahead of the cursor that flicker as static

// Types a reply out one character at a time; the few characters just ahead of
// the cursor flicker as pixel static and then resolve. The pixel face "speaks"
// for as long as the typing lasts. Motion off = shown at once.
export default function GlitchText({ text, animate, onProgress }: { text: string; animate: boolean; onProgress?: () => void }) {
  const { reduced } = useMotion();
  const instant = reduced || !animate;
  const [n, setN] = useState(0);
  const [tick, setTick] = useState(0);
  const progress = useRef(onProgress);
  useEffect(() => {
    progress.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    if (instant) return;
    const per = 24;
    mindActions.speakFor(text.length * per + 400);
    sfx.reply();
    const id = window.setInterval(() => {
      setN((c) => {
        if (c >= text.length) {
          window.clearInterval(id);
          return c;
        }
        if (c % 6 === 0) sfx.tick();
        return c + 1;
      });
      setTick((x) => x + 1);
      progress.current?.();
    }, per);
    return () => window.clearInterval(id);
  }, [instant, text]);

  if (instant || n >= text.length) return <>{text}</>;
  let ahead = "";
  for (let i = n; i < Math.min(text.length, n + HEAD); i++) {
    ahead += text[i] === " " ? " " : NOISE[(i * 7 + tick * 3) % NOISE.length];
  }
  // The invisible full text holds the bubble at its final size, so it doesn't jump while typing.
  return (
    <span className="relative block">
      <span aria-hidden className="invisible">
        {text}
      </span>
      <span className="absolute inset-0">
        {text.slice(0, n)}
        <span className="text-[var(--lime)] opacity-80">{ahead}</span>
      </span>
    </span>
  );
}
