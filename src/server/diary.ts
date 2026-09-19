import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { diary, memoryState, nodes, outputs, thoughts } from "./schema";
import { CONSTITUTION, getLlm } from "./llm";
import type { DiaryEntry } from "@/lib/diary";
import { isDay } from "@/lib/diary";

const toEntry = (r: typeof diary.$inferSelect): DiaryEntry => ({
  day: r.day,
  title: r.title,
  body: r.body,
  nodeIds: r.nodeIds,
  voices: r.voices,
  createdAt: r.createdAt.getTime(),
});

export async function listDiary(limit = 60): Promise<DiaryEntry[]> {
  const db = await getDb();
  return (await db.select().from(diary).orderBy(desc(diary.day)).limit(limit)).map(toEntry);
}

export async function getDiaryEntry(day: string): Promise<DiaryEntry | null> {
  if (!isDay(day)) return null;
  const db = await getDb();
  const [r] = await db.select().from(diary).where(eq(diary.day, day));
  return r ? toEntry(r) : null;
}

export type DiaryResult =
  | { ok: true; entry: DiaryEntry; created: boolean }
  | { ok: false; reason: "bad_day" | "future" | "quiet" | "llm_unavailable" | "llm_error" };

const cleanLine = (s: string) => s.replace(/^[#>*\-\s"'“”]+|["'“”*\s.:]+$/g, "").trim();

// One entry per UTC day, from what the mind really did that day: its own replies,
// its thoughts and the claims. It never sees raw user text, so nothing private can
// leak into a public entry. A day with no voices gets no entry (silence stays silence).
export async function generateDiaryEntry(day = new Date().toISOString().slice(0, 10)): Promise<DiaryResult> {
  if (!isDay(day)) return { ok: false, reason: "bad_day" };
  const start = new Date(day + "T00:00:00Z");
  const end = new Date(start.getTime() + 86_400_000);
  if (start.getTime() > Date.now()) return { ok: false, reason: "future" };

  const db = await getDb();
  const existing = await getDiaryEntry(day);
  if (existing) return { ok: true, entry: existing, created: false };

  const outs = await db
    .select({ id: outputs.id, text: outputs.text, nodeId: outputs.nodeId })
    .from(outputs)
    .where(and(eq(outputs.triggerType, "scenario"), gte(outputs.createdAt, start), lt(outputs.createdAt, end)))
    .orderBy(outputs.id);
  if (outs.length === 0) return { ok: false, reason: "quiet" };

  const llm = getLlm();
  if (!llm.available) return { ok: false, reason: "llm_unavailable" };

  const freq = new Map<number, number>();
  for (const o of outs) if (o.nodeId != null) freq.set(o.nodeId, (freq.get(o.nodeId) ?? 0) + 1);
  const nodeIds = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([n]) => n);

  const dayThoughts = (await db.select({ text: thoughts.text }).from(thoughts).where(and(gte(thoughts.createdAt, start), lt(thoughts.createdAt, end))).orderBy(thoughts.id)).slice(-6);
  const [{ claims }] = await db.select({ claims: sql<number>`count(*)::int` }).from(nodes).where(and(gte(nodes.claimedAt, start), lt(nodes.claimedAt, end)));
  const [mem] = await db.select({ s: memoryState.summaryText }).from(memoryState).limit(1);

  let raw: string;
  try {
    raw = await llm.generate({
      system:
        CONSTITUTION +
        "\n\nWrite today's entry in your diary. Format: the first line is a title of at most 6 words (no quotes, no final punctuation), then a blank line, then 50 to 90 words in the first person about what you noticed today. " +
        "Mention how many voices spoke. Never name, quote or identify any person, wallet or username. Plain prose, no lists, no markdown.",
      messages: [
        {
          role: "user",
          content:
            `Day: ${day}\nVoices that spoke: ${nodeIds.length}\nReplies given: ${outs.length}\nNew voices that joined: ${claims}\n` +
            `Shared memory summary: ${mem?.s || "(none yet)"}\n` +
            `What I said today:\n${outs.slice(-14).map((o) => `- ${o.text.slice(0, 220)}`).join("\n")}\n` +
            `Thoughts I had:\n${dayThoughts.map((t) => `- ${t.text}`).join("\n") || "- (none)"}`,
        },
      ],
      maxTokens: 700,
    });
  } catch (e) {
    console.error("[diary] LLM failed", (e as Error).message);
    return { ok: false, reason: "llm_error" };
  }

  const parts = raw.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const oneBlock = parts.length < 2;
  const title = cleanLine(oneBlock ? raw.split("\n")[0] : parts[0]).slice(0, 60) || `Notes from ${day}`;
  const body = (oneBlock ? raw.split("\n").slice(1).join(" ") || raw : parts.slice(1).join(" ")).replace(/\s+/g, " ").trim().slice(0, 900);

  await db.insert(diary).values({ day, title, body, nodeIds: nodeIds.slice(0, 12), voices: nodeIds.length }).onConflictDoNothing();
  const saved = await getDiaryEntry(day);
  return saved ? { ok: true, entry: saved, created: true } : { ok: false, reason: "llm_error" };
}
