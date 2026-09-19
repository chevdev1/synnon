"use client";

import type { ReactNode } from "react";
import { useDemo } from "@/lib/demo";
import { ApiLiveProvider } from "./ApiLiveProvider";
import { DemoLiveProvider } from "./DemoLiveProvider";

// Swapping providers remounts the tree, so demo state can never leak into real state.
export function LiveRoot({ children }: { children: ReactNode }) {
  const { on } = useDemo();
  return on ? <DemoLiveProvider key="demo">{children}</DemoLiveProvider> : <ApiLiveProvider key="api">{children}</ApiLiveProvider>;
}
