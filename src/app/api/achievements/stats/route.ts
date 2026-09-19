import { getAchStats } from "@/server/achStats";
import { json } from "@/server/http";

export async function GET() {
  return json(await getAchStats());
}
