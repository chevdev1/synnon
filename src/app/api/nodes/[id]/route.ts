import { getNodeProfile } from "@/server/nodeProfile";
import { fail, json, parseId } from "@/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/nodes/[id]">) {
  const id = parseId((await ctx.params).id);
  if (!id) return fail(400, "bad node id");
  const profile = await getNodeProfile(id);
  if (!profile) return fail(404, "no such node");
  return json(profile);
}
