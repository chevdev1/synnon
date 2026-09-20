import { getGoal } from "@/server/goal";
import { json } from "@/server/http";

export async function GET() {
  return json(await getGoal());
}
