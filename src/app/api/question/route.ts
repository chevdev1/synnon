import { getSessionUser } from "@/server/auth";
import { json } from "@/server/http";
import { getQuestionState } from "@/server/question";

export async function GET() {
  const user = await getSessionUser().catch(() => null);
  return json(await getQuestionState(user?.id ?? null));
}
