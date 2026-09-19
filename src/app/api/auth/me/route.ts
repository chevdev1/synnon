import { getSessionUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { nodes } from "@/server/schema";
import { eq } from "drizzle-orm";
import { json } from "@/server/http";
import { shortAddress } from "@/server/wallet";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return json({ user: null });
  const db = await getDb();
  const [node] = await db.select({ id: nodes.id }).from(nodes).where(eq(nodes.ownerUserId, user.id));
  return json({
    user: { id: user.id, username: user.username, wallet: user.walletAddress ? shortAddress(user.walletAddress) : null },
    nodeId: node?.id ?? null,
  });
}
