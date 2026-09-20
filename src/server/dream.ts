import { desc, lt } from "drizzle-orm";
import { getDb } from "./db";
import { outputs } from "./schema";
import { pickDream, type Dream } from "@/lib/dream";
import { isDay } from "@/lib/diary";

// The dream of a night: fragments of the mind's own past replies (before that day ends).
export async function getDream(day: string): Promise<Dream | null> {
  if (!isDay(day)) return null;
  const end = new Date(Date.parse(day + "T00:00:00Z") + 86_400_000);
  const db = await getDb();
  const rows = await db
    .select({ nodeId: outputs.nodeId, text: outputs.text })
    .from(outputs)
    .where(lt(outputs.createdAt, end))
    .orderBy(desc(outputs.id))
    .limit(120);
  if (rows.length < 3) return null;
  return pickDream(day, rows);
}
