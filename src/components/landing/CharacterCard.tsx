"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { PixelCharacter } from "@/components/ui/PixelArt";
import { CHARACTER } from "@/lib/mock/data";
import { useLive } from "@/lib/live/context";

// Demo only: the mood line drifts on its own. In real mode it is whatever the
// server says (memory_state.character_state_json).
const MOODS = ["curious", "watching", "listening", "wondering", "restless"];

export default function CharacterCard() {
  const { mode, character } = useLive();
  const traits = character?.traits ?? CHARACTER.traits;
  const quote = character?.quote ?? CHARACTER.quote;
  const [mood, setMood] = useState(0);
  useEffect(() => {
    if (mode !== "demo") return;
    const id = window.setInterval(() => setMood((m) => (m + 1) % MOODS.length), 5200);
    return () => window.clearInterval(id);
  }, [mode]);
  const moodLabel = mode === "demo" ? MOODS[mood] : (character?.mood ?? "curious");

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-y-auto">
      <CardTitle>Character</CardTitle>
      <div className="mt-3 flex items-center gap-3">
        <PixelCharacter scale={2} className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" />
        <div className="min-w-0">
          <div className="font-head text-[8px] uppercase text-[var(--muted)]">mood</div>
          <div key={moodLabel} className="fade-in-up text-[17px] capitalize text-[var(--lime)]">
            {moodLabel}
          </div>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[16px] text-[var(--text-2)]">
        {traits.map((t, i) => (
          <li key={t} className="fade-in-up flex items-start gap-1.5" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="mt-[5px] h-1.5 w-1.5 shrink-0 bg-[var(--cell-pink)]" />
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-3 border-t-2 border-[var(--divider)] pt-3 text-[17px] leading-snug text-[var(--text-2)]">
        {quote}
      </div>
    </Card>
  );
}
