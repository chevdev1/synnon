import { getTimelapse } from "@/server/timelapse";
import { json } from "@/server/http";

export async function GET() {
  return json(await getTimelapse());
}
