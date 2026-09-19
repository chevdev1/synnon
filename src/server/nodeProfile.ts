import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { memoryState, nodes, outputs, scenarios, thoughts, users } from "./schema";
import type { NodeProfile, HistoryItem } from "@/lib/nodeProfile";
import type { NodeStatus } from "@/lib/brain/types";

const HISTORY_LIMIT = 40;

// Only approved scenarios are public; raw text of pending/rejected ones never leaves the server.
export async function getNodeProfile(id: number): Promise<NodeProfile | null> {
  const db = await getDb();
  const [node] = await db
    .select({ id: nodes.id, status: nodes.status, claimedAt: nodes.claimedAt, lastActiveAt: nodes.lastActiveAt, ownerName: users.username })
    .from(nodes)
    .leftJoin(users, eq(users.id, nodes.ownerUserId))
    .where(eq(nodes.id, id));
  if (!node) return null;

  const rows = await db
    .select({ id: scenarios.id, title: scenarios.title, createdAt: scenarios.createdAt, outputId: outputs.id, reply: outputs.text })
    .from(scenarios)
    .leftJoin(outputs, eq(outputs.scenarioId, scenarios.id))
    .where(and(eq(scenarios.nodeId, id), eq(scenarios.moderationStatus, "approved")))
    .orderBy(desc(scenarios.id))
    .limit(HISTORY_LIMIT);

  const [mem] = await db.select({ recent: memoryState.recentOutputIds }).from(memoryState).limit(1);
  const recent = new Set(mem?.recent ?? []);
  const mine = new Set(rows.map((r) => r.outputId).filter((v): v is number => v != null));

  const [{ voices }] = await db
    .select({ voices: sql<number>`count(*)::int` })
    .from(scenarios)
    .where(and(eq(scenarios.nodeId, id), eq(scenarios.moderationStatus, "approved")));
  const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(outputs).where(eq(outputs.triggerType, "scenario"));
  const [{ answered }] = await db
    .select({ answered: sql<number>`count(*)::int` })
    .from(outputs)
    .where(and(eq(outputs.nodeId, id), eq(outputs.triggerType, "scenario")));

  // Thoughts that drew on one of this cell's replies (recent thoughts only; cheap and enough for a timeline).
  const recentThoughts = await db.select().from(thoughts).orderBy(desc(thoughts.id)).limit(200);
  const shaped = recentThoughts.filter((t) => t.sourceOutputIds.some((o) => mine.has(o)));

  const history: HistoryItem[] = [
    ...rows.map((r): HistoryItem => ({ kind: "voice", id: r.id, ts: r.createdAt.getTime(), title: r.title, reply: r.reply ?? null, inMemory: r.outputId != null && recent.has(r.outputId) })),
    ...shaped.map((t): HistoryItem => ({ kind: "thought", id: t.id, ts: t.createdAt.getTime(), text: t.text })),
  ].sort((a, b) => b.ts - a.ts);

  return {
    node: {
      id: node.id,
      status: node.status as NodeStatus,
      ownerName: node.ownerName ?? null,
      claimedAt: node.claimedAt?.getTime() ?? null,
      lastActiveAt: node.lastActiveAt?.getTime() ?? null,
    },
    stats: {
      voices,
      inMemory: history.filter((h) => h.kind === "voice" && h.inMemory).length,
      thoughtsShaped: shaped.length,
      sharePct: total > 0 ? Math.round((answered / total) * 1000) / 10 : 0,
    },
    history,
  };
}
