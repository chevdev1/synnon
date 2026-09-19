import { getSessionUser } from "@/server/auth";
import { rateLimit } from "@/server/guards";
import { fail, json, readJson } from "@/server/http";
import { submitScenario } from "@/server/service";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return fail(401, "sign in first");
  const body = await readJson(req);
  const nodeId = Number(body?.nodeId);
  if (!Number.isInteger(nodeId)) return fail(400, "nodeId is required");

  const rl = rateLimit(`scenario:${user.id}`, 6, 60_000);
  if (!rl.ok) return fail(429, "slow down a little", { retryAfterSec: rl.retryAfterSec });

  const r = await submitScenario(user.id, nodeId, body?.text);
  if (!r.ok) return fail(r.code, r.error);
  // 202 when we kept the scenario but the mind couldn't answer (no LLM).
  return json({ scenarioId: r.scenarioId, llm: r.llm, output: r.output }, r.llm === "ok" ? 201 : 202);
}
