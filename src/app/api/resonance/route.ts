import { getResonance } from "@/server/resonance";
import { json } from "@/server/http";

export async function GET() {
  return json({ pairs: await getResonance() });
}
