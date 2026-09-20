import type { Metadata } from "next";
import DiaryView from "@/components/diary/DiaryView";

export const metadata: Metadata = {
  title: "Diary of the mind | SYNNOD",
  description: "Once a day the SYNNOD mind writes down what it noticed, from what its 128 voices really told it.",
};

export default function Page() {
  return <DiaryView />;
}
