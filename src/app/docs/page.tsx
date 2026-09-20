import type { Metadata } from "next";
import Atmosphere from "@/components/landing/Atmosphere";
import DocsView from "@/components/docs/DocsView";

export const metadata: Metadata = {
  title: "Docs | SYNNOD",
  description: "What SYNNOD is and how it works: cells, shared memory, wallet sign-in, the token on Robinhood Chain, and the rules of the project.",
};

export default function DocsPage() {
  return (
    <div className="relative min-h-dvh bg-[var(--bg)]">
      <Atmosphere />
      <div className="relative z-10">
        <DocsView />
      </div>
    </div>
  );
}
