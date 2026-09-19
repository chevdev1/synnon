import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import CursorFx from "@/components/ui/CursorFx";
import TodSync from "@/components/ui/TodSync";
import AchievementToaster from "@/components/achievements/AchievementToaster";
// 8-bit look: Press Start 2P for headings/labels, VT323 (a crisp 1px-grid
// terminal face, readable at small sizes) for running text.
const pixelHead = Press_Start_2P({
  variable: "--font-pixel-head",
  subsets: ["latin"],
  weight: "400",
});

const pixelBody = VT323({
  variable: "--font-pixel-body",
  subsets: ["latin"],
  weight: "400",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://synnon.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "SYNNOD — 128 voices. One mind.",
  description:
    "SYNNOD is a shared digital character with no single author. Claim a cell, speak, and watch one mind grow from everyone who talks to it.",
};

// Sets the time-of-day palette before first paint (no flash of the wrong hour).
// Same rules as lib/tod.ts: dawn 5-8, day 8-17, dusk 17-20, night otherwise.
const TOD_SCRIPT = `(function(){try{var P=['dawn','day','dusk','night'];var q=new URLSearchParams(location.search).get('tod');var m=q||localStorage.getItem('synnod-tod')||'auto';var h=new Date().getHours();var p=P.indexOf(m)>-1?m:(h>=5&&h<8?'dawn':h>=8&&h<17?'day':h>=17&&h<20?'dusk':'night');document.documentElement.dataset.tod=p}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${pixelHead.variable} ${pixelBody.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TOD_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <TodSync />
        <AchievementToaster />
        <CursorFx />
      </body>
    </html>
  );
}
