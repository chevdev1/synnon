import { after } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { thoughts } from "@/server/schema";
import { json } from "@/server/http";
import { rateLimit } from "@/server/guards";
import { generateAutonomousThought } from "@/server/service";

const THINK_EVERY_MS = 3 * 3_600_000;

export async function GET() {
  const db = await getDb();
  const rows = await db.select({ id: thoughts.id, text: thoughts.text, createdAt: thoughts.createdAt }).from(thoughts).orderBy(desc(thoughts.id)).limit(20);
  // No paid scheduler needed: when somebody looks and the mind has been quiet for a while,
  // it thinks once (at most once per 30 minutes, and never more than every 3 hours).
  const last = rows[0]?.createdAt.getTime() ?? 0;
  if (Date.now() - last > THINK_EVERY_MS && rateLimit("lazy:thoughts", 1, 30 * 60_000).ok) {
    after(async () => {
      try {
        await generateAutonomousThought();
      } catch (e) {
        console.error("[lazy thought]", (e as Error).message);
      }
    });
  }
  return json({ thoughts: rows });
}
