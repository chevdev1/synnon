import type { Metadata } from "next";
import GoalPage from "@/components/goal/GoalPage";

export const metadata: Metadata = {
  title: "Community goal — SYNNOD",
  description: "Every voice told this week counts toward one shared goal, and each milestone changes the sky for everyone.",
};

export default function Page() {
  return <GoalPage />;
}
