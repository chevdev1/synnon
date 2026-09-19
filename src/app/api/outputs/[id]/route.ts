import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { outputs } from "@/server/schema";
import { fail, json, parseId } from "@/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/outputs/[id]">) {
  const id = parseId((await ctx.params).id);
  if (!id) return fail(400, "bad output id");
  const db = await getDb();
  const [row] = await db.select().from(outputs).where(eq(outputs.id, id));
  if (!row) return fail(404, "no such output");
  return json({ output: { id: row.id, nodeId: row.nodeId, trigger: row.triggerType, text: row.text, createdAt: row.createdAt, visualState: row.visualStateJson } });
}
