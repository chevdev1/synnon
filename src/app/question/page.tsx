import type { Metadata } from "next";
import QuestionPage from "@/components/question/QuestionPage";

export const metadata: Metadata = {
  title: "Question of the week | SYNNOD",
  description: "Once a week the SYNNOD mind asks all its voices one question. Every answer lights a cell in a mosaic shaped like the brain.",
};

export default function Page() {
  return <QuestionPage />;
}
