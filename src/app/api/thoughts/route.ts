import { desc } from "drizzle-orm";
import { getDb } from "@/server/db";
import { thoughts } from "@/server/schema";
import { json } from "@/server/http";

export async function GET() {
  const db = await getDb();
  const rows = await db.select({ id: thoughts.id, text: thoughts.text, createdAt: thoughts.createdAt }).from(thoughts).orderBy(desc(thoughts.id)).limit(20);
  return json({ thoughts: rows });
}
