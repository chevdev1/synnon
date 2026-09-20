import { and, eq, gte } from "drizzle-orm";
import { getDb } from "./db";
import { scenarios } from "./schema";
import { findResonance, type Resonance } from "@/lib/resonance";

// Which cells echo each other, from approved voices of the last 14 days.
export async function getResonance(): Promise<Resonance[]> {
  const db = await getDb();
  const since = new Date(Date.now() - 14 * 86_400_000);
  const rows = await db
    .select({ node: scenarios.nodeId, text: scenarios.rawText, title: scenarios.title })
    .from(scenarios)
    .where(and(eq(scenarios.moderationStatus, "approved"), gte(scenarios.createdAt, since)));
  const byNode = new Map<number, string[]>();
  for (const r of rows) byNode.set(r.node, [...(byNode.get(r.node) ?? []), `${r.title} ${r.text}`.slice(0, 600)]);
  return findResonance(byNode);
}
