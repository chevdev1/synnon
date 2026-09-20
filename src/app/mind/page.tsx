import type { Metadata } from "next";
import MindPage from "@/components/mind/MindPage";

export const metadata: Metadata = {
  title: "The mind: stage and picture of the day | SYNNOD",
  description: "How grown up the SYNNOD mind is, what changes at every stage, and today's pixel picture.",
};

export default function Page() {
  return <MindPage />;
}
