import { and, count, desc, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { moodLog, nodes, outputs, thoughts } from "./schema";
import { dominantMood, lastSevenDays, MOOD_LIST, type MoodDay, type MoodId, type MoodWeek } from "@/lib/mood";

// The mind's mood, derived from what is really happening (no dice, no AI guess):
//  restless  - many replies in the last hour
//  listening - somebody spoke to it in the last 10 minutes
//  wondering - its latest thought (last 3 hours) is a question
//  curious   - a new voice joined in the last day
//  watching  - otherwise: awake and quiet
export async function deriveMood(): Promise<MoodId> {
  const db = await getDb();
  const hourAgo = new Date(Date.now() - 3_600_000);
  const [{ n: lastHour }] = await db.select({ n: count() }).from(outputs).where(gte(outputs.createdAt, hourAgo));
  if (lastHour >= 6) return "restless";
  const [last] = await db.select({ ts: outputs.createdAt }).from(outputs).orderBy(desc(outputs.id)).limit(1);
  if (last && Date.now() - last.ts.getTime() < 10 * 60_000) return "listening";
  const [th] = await db.select({ text: thoughts.text, ts: thoughts.createdAt }).from(thoughts).orderBy(desc(thoughts.id)).limit(1);
  if (th && Date.now() - th.ts.getTime() < 3 * 3_600_000 && th.text.includes("?")) return "wondering";
  const [{ n: joined }] = await db.select({ n: count() }).from(nodes).where(gte(nodes.claimedAt, new Date(Date.now() - 86_400_000)));
  if (joined > 0) return "curious";
  return "watching";
}

// Record the current mood if the last record is older than 10 minutes. Called whenever
// something happens (a reply, a thought, somebody looking), so a week of it accrues.
export async function sampleMood(): Promise<MoodId> {
  const mood = await deriveMood();
  const db = await getDb();
  const [last] = await db.select({ ts: moodLog.ts }).from(moodLog).orderBy(desc(moodLog.id)).limit(1);
  if (!last || Date.now() - last.ts.getTime() > 10 * 60_000) await db.insert(moodLog).values({ mood });
  return mood;
}

export async function getMoodWeek(): Promise<MoodWeek> {
  const db = await getDb();
  const since = new Date(Date.now() - 7 * 86_400_000);
  const rows = await db
    .select({ day: sql<string>`to_char(${moodLog.ts} at time zone 'utc', 'YYYY-MM-DD')`, mood: moodLog.mood, n: count() })
    .from(moodLog)
    .where(and(gte(moodLog.ts, since)))
    .groupBy(sql`1`, moodLog.mood);
  const byDay = new Map<string, MoodDay>();
  for (const day of lastSevenDays()) byDay.set(day, { day, counts: {} });
  for (const r of rows) {
    const d = byDay.get(r.day);
    if (d && (MOOD_LIST as readonly string[]).includes(r.mood)) d.counts[r.mood as MoodId] = r.n;
  }
  const days = [...byDay.values()];
  return { days, dominant: dominantMood(days), source: "live" };
}
