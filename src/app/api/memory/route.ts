import type { NextRequest } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { getSessionUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { nodes, outputs, scenarios } from "@/server/schema";
import { fail, json } from "@/server/http";

// Public archive = approved scenarios paired with the mind's reply. Nothing
// pending or rejected is ever exposed.
export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") ?? "recent";
  if (!["recent", "popular", "mine"].includes(tab)) return fail(400, "tab must be recent|popular|mine");
  const db = await getDb();

  const base = db
    .select({ id: outputs.id, nodeId: outputs.nodeId, title: scenarios.title, reply: outputs.text, createdAt: outputs.createdAt })
    .from(outputs)
    .innerJoin(scenarios, eq(scenarios.id, outputs.scenarioId));

  if (tab === "mine") {
    const user = await getSessionUser();
    if (!user) return json({ items: [] });
    const items = await base.innerJoin(nodes, eq(nodes.id, outputs.nodeId)).where(eq(nodes.ownerUserId, user.id)).orderBy(desc(outputs.id)).limit(30);
    return json({ items });
  }
  if (tab === "popular") {
    // No voting yet: "popular" = nodes that have contributed the most.
    const items = await base
      .orderBy(desc(sql`(select count(*) from outputs o2 where o2.node_id = ${outputs.nodeId})`), desc(outputs.id))
      .limit(30);
    return json({ items });
  }
  return json({ items: await base.orderBy(desc(outputs.id)).limit(30) });
}
