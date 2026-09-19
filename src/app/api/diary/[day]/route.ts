import { getDiaryEntry } from "@/server/diary";
import { fail, json } from "@/server/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/diary/[day]">) {
  const entry = await getDiaryEntry((await ctx.params).day);
  return entry ? json(entry) : fail(404, "no entry for that day");
}
