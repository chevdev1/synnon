import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import CursorFx from "@/components/ui/CursorFx";

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

export const metadata: Metadata = {
  title: "SYNNOD — 128 voices. One mind.",
  description:
    "SYNNOD is a shared digital character with no single author. Claim a cell, speak, and watch one mind grow from everyone who talks to it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixelHead.variable} ${pixelBody.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <CursorFx />
      </body>
    </html>
  );
}
