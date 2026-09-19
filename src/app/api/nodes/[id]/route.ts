import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { nodes, outputs, scenarios, users } from "@/server/schema";
import { fail, json, parseId } from "@/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/nodes/[id]">) {
  const id = parseId((await ctx.params).id);
  if (!id) return fail(400, "bad node id");
  const db = await getDb();
  const [node] = await db
    .select({ id: nodes.id, label: nodes.label, status: nodes.status, claimedAt: nodes.claimedAt, lastActiveAt: nodes.lastActiveAt, ownerName: users.username })
    .from(nodes)
    .leftJoin(users, eq(users.id, nodes.ownerUserId))
    .where(eq(nodes.id, id));
  if (!node) return fail(404, "no such node");
  // Only approved scenarios are public; raw text of pending/rejected ones never leaves the server.
  const recent = await db
    .select({ id: scenarios.id, title: scenarios.title, createdAt: scenarios.createdAt, output: outputs.text })
    .from(scenarios)
    .leftJoin(outputs, eq(outputs.scenarioId, scenarios.id))
    .where(and(eq(scenarios.nodeId, id), eq(scenarios.moderationStatus, "approved")))
    .orderBy(desc(scenarios.id))
    .limit(5);
  return json({ node, recent });
}
