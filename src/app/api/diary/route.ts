import { after } from "next/server";
import { generateDiaryEntry, getDiaryEntry, listDiary } from "@/server/diary";
import { json } from "@/server/http";
import { rateLimit } from "@/server/guards";

export async function GET() {
  const entries = await listDiary();
  // Yesterday's entry is written the first time somebody opens the diary, if the daily
  // scheduler has not done it yet (a quiet day simply gets no entry).
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (!entries.some((e) => e.day === yesterday) && rateLimit("lazy:diary", 1, 30 * 60_000).ok) {
    after(async () => {
      try {
        if (!(await getDiaryEntry(yesterday))) await generateDiaryEntry(yesterday);
      } catch (e) {
        console.error("[lazy diary]", (e as Error).message);
      }
    });
  }
  return json({ entries });
}
