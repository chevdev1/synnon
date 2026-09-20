import type { Metadata } from "next";
import DailyPage from "@/components/daily/DailyPage";

export const metadata: Metadata = {
  title: "Daily quests | SYNNOD",
  description: "Three small quests a day, a streak that grows, and a companion for a week of showing up.",
};

export default function Page() {
  return <DailyPage />;
}
