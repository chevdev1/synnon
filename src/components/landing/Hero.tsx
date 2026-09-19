"use client";

import { Card } from "@/components/ui/Card";
import HeroLeft from "./HeroLeft";
import BrainStage from "./BrainStage";
import HeroRight from "./HeroRight";

export default function Hero() {
  return (
    <div className="grid grid-cols-1 gap-3 xl:h-full xl:grid-cols-[258px_1fr_396px] xl:grid-rows-1">
      <Card padded={false} help="intro" className="order-2 min-h-0 overflow-y-auto xl:order-1">
        <HeroLeft />
      </Card>
      <Card
        padded={false}
        help="brain"
        className="order-1 flex aspect-[4/3] min-h-0 flex-col overflow-hidden xl:order-2 xl:aspect-auto"
      >
        <BrainStage />
      </Card>
      <div className="order-3 min-h-0 overflow-y-auto xl:h-full">
        <HeroRight />
      </div>
    </div>
  );
}
