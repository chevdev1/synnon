"use client";

import Link from "next/link";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { useAch } from "@/lib/achStore";
import AchIcon from "./AchIcon";

// Header button: trophy + how many are unlocked; opens the achievements page.
export default function AchButton() {
  const { unlocked } = useAch();
  const n = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
  return (
    <Link
      href="/achievements"
      data-help-id="achievements"
      aria-label={`Achievements: ${n} of ${ACHIEVEMENTS.length}`}
      className="pixel-btn font-head flex h-11 items-center gap-2 border-2 border-[#ffd166] px-3 text-[8px] uppercase text-[#ffd166] sm:h-9"
    >
      <AchIcon icon="trophy" color="#ffd166" size={16} />
      {n}/{ACHIEVEMENTS.length}
    </Link>
  );
}
