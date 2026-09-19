import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { memoryState, nodes, outputs, scenarios, thoughts, users } from "./schema";

export interface AchStats {
  cells: number; // claimed cells (the base for the voice achievements)
  users: number; // signed-up people (the base for wallet / guest achievements)
  counts: Record<string, number>; // achievement id -> how many hold it
  base: Record<string, "cells" | "users">;
}

// How common each data-driven achievement is: the share of claimed cells (or people)
// that have it, like "3.2% of players" on Steam. Visitor achievements live in each
// browser, so they have no global number.
export async function getAchStats(): Promise<AchStats> {
  const db = await getDb();
  const owned = await db.select({ id: nodes.id }).from(nodes).where(isNotNull(nodes.ownerUserId));
  const cells = owned.length;
  const ownedIds = new Set(owned.map((n) => n.id));

  const voices = new Map<number, number>();
  for (const r of await db
    .select({ node: scenarios.nodeId, n: sql<number>`count(*)::int` })
    .from(scenarios)
    .where(eq(scenarios.moderationStatus, "approved"))
    .groupBy(scenarios.nodeId))
    voices.set(r.node, r.n);

  const outs = await db.select({ id: outputs.id, node: outputs.nodeId }).from(outputs).where(and(eq(outputs.triggerType, "scenario"), isNotNull(outputs.nodeId)));
  const outNode = new Map(outs.map((o) => [o.id, o.node as number]));
  const answered = new Map<number, number>();
  for (const o of outs) answered.set(o.node as number, (answered.get(o.node as number) ?? 0) + 1);

  const shaped = new Map<number, number>();
  for (const t of await db.select({ src: thoughts.sourceOutputIds }).from(thoughts)) {
    const hit = new Set(t.src.map((s) => outNode.get(s)).filter((n): n is number => n != null));
    for (const n of hit) shaped.set(n, (shaped.get(n) ?? 0) + 1);
  }

  const [mem] = await db.select({ recent: memoryState.recentOutputIds }).from(memoryState).limit(1);
  const inMem = new Map<number, number>();
  for (const id of mem?.recent ?? []) {
    const n = outNode.get(id);
    if (n != null) inMem.set(n, (inMem.get(n) ?? 0) + 1);
  }

  const totalAnswered = outs.length;
  const count = (f: (id: number) => boolean) => [...ownedIds].filter(f).length;
  const v = (id: number) => voices.get(id) ?? 0;

  const [{ n: userCount }] = await db.select({ n: sql<number>`count(*)::int` }).from(users);
  const [{ n: walletUsers }] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(isNotNull(users.walletAddress));

  return {
    cells,
    users: userCount,
    counts: {
      "first-cell": cells,
      "first-words": count((id) => v(id) >= 1),
      chatter: count((id) => v(id) >= 10),
      storyteller: count((id) => v(id) >= 25),
      chorus: count((id) => v(id) >= 50),
      "thought-seed": count((id) => (shaped.get(id) ?? 0) >= 1),
      "mind-weaver": count((id) => (shaped.get(id) ?? 0) >= 5),
      "long-memory": count((id) => (inMem.get(id) ?? 0) >= 3),
      "share-of-mind": count((id) => v(id) >= 3 && totalAnswered > 0 && ((answered.get(id) ?? 0) / totalAnswered) * 100 >= 10),
      uplink: walletUsers,
      "anonymous-signal": userCount - walletUsers,
    },
    base: {
      "first-cell": "users",
      "first-words": "cells", chatter: "cells", storyteller: "cells", chorus: "cells", "thought-seed": "cells", "mind-weaver": "cells", "long-memory": "cells", "share-of-mind": "cells",
      uplink: "users", "anonymous-signal": "users",
    },
  };
}
