import { getCharacter } from "@/server/service";
import { json } from "@/server/http";

export async function GET() {
  return json(await getCharacter());
}
