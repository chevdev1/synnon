import { getSessionUser } from "@/server/auth";
import { claimNode } from "@/server/service";
import { fail, json, parseId } from "@/server/http";

export async function POST(_req: Request, ctx: RouteContext<"/api/nodes/[id]/claim">) {
  const user = await getSessionUser();
  if (!user) return fail(401, "sign in first");
  const id = parseId((await ctx.params).id);
  if (!id) return fail(400, "bad node id");
  const r = await claimNode(user.id, id);
  return r.ok ? json({ node: { id: r.node.id, status: r.node.status } }) : fail(r.code, r.error);
}
