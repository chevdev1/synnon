"use client";

import DayScene from "@/components/ui/DayScene";
import { useMind } from "@/lib/mind";
import { daySeed } from "@/lib/scene";
import { useStage } from "@/lib/useStage";
import { useTod } from "@/lib/tod";

// The inputs of today's picture, from the live state of the site.
export function useSceneOpts() {
  const { phase } = useTod();
  const { mood } = useMind();
  const { stage, taken, total } = useStage();
  return { seed: daySeed(), phase, mood, voices: taken, total, stage: stage.id };
}

export default function LiveDayScene({ w, h, className }: { w: number; h: number; className?: string }) {
  const opts = useSceneOpts();
  return <DayScene w={w} h={h} opts={opts} className={className} />;
}
