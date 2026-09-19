"use client";

import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import MemoryCard from "@/components/landing/MemoryCard";
import NodeChatCard from "@/components/landing/NodeChatCard";
import ThoughtsCard from "@/components/landing/ThoughtsCard";
import CharacterCard from "@/components/landing/CharacterCard";
import Footer from "@/components/landing/Footer";
import Atmosphere from "@/components/landing/Atmosphere";
import ClaimDialog from "@/components/landing/ClaimDialog";
import NodeSheet from "@/components/landing/NodeSheet";
import AchievementsWatcher from "@/components/achievements/AchievementsWatcher";
import IntroGate from "@/components/landing/IntroGate";
import HelpLayer from "@/components/landing/HelpLayer";
import { LiveRoot } from "@/lib/live/LiveRoot";

export default function Home() {
  return (
    <LiveRoot>
      <div className="relative flex min-h-dvh flex-col bg-[var(--bg)] xl:h-dvh xl:overflow-hidden">
        <Atmosphere />
        <Header />
        <main className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-3 px-5 py-3 xl:min-h-0">
          <div className="xl:min-h-0 xl:flex-[1.7]">
            <Hero />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:min-h-0 xl:flex-1 xl:grid-cols-4 xl:grid-rows-1">
            <MemoryCard />
            <NodeChatCard />
            <ThoughtsCard />
            <CharacterCard />
          </div>
        </main>
        <Footer />
        <ClaimDialog />
        <NodeSheet />
        <AchievementsWatcher />
        <HelpLayer />
        <IntroGate />
      </div>
    </LiveRoot>
  );
}
