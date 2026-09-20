import { getDream } from "@/server/dream";
import { fail, json } from "@/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/dream/[day]">) {
  const dream = await getDream((await ctx.params).day);
  return dream ? json(dream) : fail(404, "no dream that night");
}
