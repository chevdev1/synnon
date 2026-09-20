import { and, eq, gte } from "drizzle-orm";
import { getDb } from "./db";
import { scenarios } from "./schema";
import { findChorus, findResonance, type Chorus, type Resonance } from "@/lib/resonance";

// Which cells echo each other: pairs from approved voices of the last 14 days, choruses
// (3+ cells on one word) from the last 48 hours.
export async function getResonance(): Promise<{ pairs: Resonance[]; choruses: Chorus[] }> {
  const db = await getDb();
  const since = new Date(Date.now() - 14 * 86_400_000);
  const recent = Date.now() - 48 * 3_600_000;
  const rows = await db
    .select({ node: scenarios.nodeId, text: scenarios.rawText, title: scenarios.title, at: scenarios.createdAt })
    .from(scenarios)
    .where(and(eq(scenarios.moderationStatus, "approved"), gte(scenarios.createdAt, since)));
  const byNode = new Map<number, string[]>();
  const byNodeRecent = new Map<number, string[]>();
  for (const r of rows) {
    const t = `${r.title} ${r.text}`.slice(0, 600);
    byNode.set(r.node, [...(byNode.get(r.node) ?? []), t]);
    if (r.at.getTime() >= recent) byNodeRecent.set(r.node, [...(byNodeRecent.get(r.node) ?? []), t]);
  }
  return { pairs: findResonance(byNode), choruses: findChorus(byNodeRecent) };
}
