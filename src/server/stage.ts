import { count, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import { nodes } from "./schema";
import { stageFor, stageVoiceHint, type Stage } from "@/lib/stages";

// The stage of the mind right now, from how many cells are actually claimed.
export async function currentStage(): Promise<{ stage: Stage; taken: number; total: number }> {
  const db = await getDb();
  const [{ n: total }] = await db.select({ n: count() }).from(nodes);
  const [{ n: taken }] = await db.select({ n: count() }).from(nodes).where(isNotNull(nodes.ownerUserId));
  return { stage: stageFor(taken, total), taken, total };
}

// Added to the system prompt so the mind speaks like its age.
export async function stageVoice(): Promise<string> {
  try {
    return stageVoiceHint((await currentStage()).stage);
  } catch {
    return "";
  }
}
