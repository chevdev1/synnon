"use client";

import { useEffect, useState } from "react";
import { useMotion } from "@/lib/motion";

// Types the lines out one character at a time; the block cursor sits on the
// line being typed, then rests on the last line. With motion off it renders
// everything at once.
export default function Typewriter({ lines, speed = 34 }: { lines: string[]; speed?: number }) {
  const { reduced } = useMotion();
  const total = lines.reduce((n, l) => n + l.length + 1, 0);
  const [count, setCount] = useState(0);
  const shown = reduced ? total : count;

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= total) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [reduced, total, speed]);

  let start = 0;
  const cursorLine = Math.max(
    0,
    lines.findIndex((l) => {
      const end = start + l.length + 1;
      const hit = shown < end;
      start = end;
      return hit;
    })
  );
  const activeLine = shown >= total ? lines.length - 1 : cursorLine;

  let offset = 0;
  return (
    <>
      {lines.map((line, i) => {
        const n = Math.max(0, Math.min(line.length, shown - offset));
        offset += line.length + 1;
        return (
          <span key={line} className="block min-h-[1.45em]">
            {line.slice(0, n)}
            {i === activeLine && <span className="cursor-blink text-[var(--lime)]">▌</span>}
          </span>
        );
      })}
    </>
  );
}
