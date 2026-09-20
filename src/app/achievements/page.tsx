import type { Metadata } from "next";
import AchievementsPage from "@/components/achievements/AchievementsPage";

export const metadata: Metadata = {
  title: "Achievements | SYNNOD",
  description: "Your achievements in the SYNNOD mind: score, level, rarity and progress.",
};

export default function Page() {
  return <AchievementsPage />;
}
