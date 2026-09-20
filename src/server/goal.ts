import { and, count, eq, gte, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import { answers, nodes, scenarios } from "./schema";
import { goalTarget, weekBounds, type GoalState } from "@/lib/goal";
import { weekId } from "@/lib/question";

// This week's community goal: how many voices the community has told so far.
export async function getGoal(): Promise<GoalState> {
  const db = await getDb();
  const { start, end } = weekBounds();
  const [{ n: taken }] = await db.select({ n: count() }).from(nodes).where(isNotNull(nodes.ownerUserId));
  const sc = await db
    .select({ node: scenarios.nodeId })
    .from(scenarios)
    .where(and(eq(scenarios.moderationStatus, "approved"), gte(scenarios.createdAt, start)));
  const an = await db
    .select({ node: answers.nodeId })
    .from(answers)
    .where(and(eq(answers.moderationStatus, "approved"), gte(answers.createdAt, start)));
  return {
    week: weekId(),
    count: sc.length + an.length,
    target: goalTarget(taken),
    contributors: new Set([...sc, ...an].map((r) => r.node)).size,
    endsAt: end.getTime(),
    source: "live",
  };
}
