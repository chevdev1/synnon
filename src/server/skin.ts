import { and, count, eq } from "drizzle-orm";
import { getDb } from "./db";
import { nodes, scenarios } from "./schema";
import { isSkin, SKIN_BY_ID, SKINS } from "@/lib/skins";

export interface SkinInfo {
  nodeId: number;
  skin: string | null;
  voices: number;
  skins: { id: string; unlocked: boolean; needVoices: number }[];
}

// Voices are counted on the server (approved scenarios), so a skin can't be faked.
export async function getSkinInfo(userId: number): Promise<SkinInfo | null> {
  const db = await getDb();
  const [node] = await db.select({ id: nodes.id, skin: nodes.skin }).from(nodes).where(eq(nodes.ownerUserId, userId)).limit(1);
  if (!node) return null;
  const [{ n }] = await db.select({ n: count() }).from(scenarios).where(and(eq(scenarios.nodeId, node.id), eq(scenarios.moderationStatus, "approved")));
  return { nodeId: node.id, skin: node.skin, voices: n, skins: SKINS.map((s) => ({ id: s.id, unlocked: n >= s.needVoices, needVoices: s.needVoices })) };
}

export async function setSkin(userId: number, skin: string | null): Promise<{ ok: true; info: SkinInfo } | { ok: false; code: number; error: string }> {
  const info = await getSkinInfo(userId);
  if (!info) return { ok: false, code: 404, error: "you don't hold a cell yet" };
  if (skin !== null) {
    if (!isSkin(skin)) return { ok: false, code: 400, error: "unknown skin" };
    if (info.voices < (SKIN_BY_ID.get(skin)?.needVoices ?? 0)) return { ok: false, code: 403, error: "not unlocked yet: keep speaking through your cell" };
  }
  const db = await getDb();
  await db.update(nodes).set({ skin }).where(eq(nodes.id, info.nodeId));
  return { ok: true, info: { ...info, skin } };
}
