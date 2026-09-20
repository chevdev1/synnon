import { getMoodWeek, sampleMood } from "@/server/mood";
import { json } from "@/server/http";

export async function GET() {
  await sampleMood(); // somebody is looking: note the mood (at most every 10 minutes)
  return json(await getMoodWeek());
}
