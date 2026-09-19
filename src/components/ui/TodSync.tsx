"use client";

import { useEffect } from "react";
import { refreshTod, useTod } from "@/lib/tod";

// Mirrors the current phase onto <html data-tod="…">; CSS does the recolouring.
export default function TodSync() {
  const { phase } = useTod();
  useEffect(() => {
    document.documentElement.dataset.tod = phase;
  }, [phase]);
  useEffect(() => {
    const id = window.setInterval(refreshTod, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
