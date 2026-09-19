import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { sessions, users, walletNonces } from "./schema";
import { accountKey, buildMessage, isChain, shortAddress, verifySignature, type Chain } from "./wallet";

// Guest identity: a nickname and a session cookie, no email, no password.
// Trade-off: the identity lives in this browser. Clearing cookies loses the
// node's owner session (wallet auth is the planned upgrade path, spec 8).
const COOKIE = "synnod_session";
const SESSION_DAYS = 90;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const NAME_RE = /^[\p{L}\p{N}_-]{2,20}$/u;

export function cleanNickname(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const t = s.trim();
  return NAME_RE.test(t) ? t : null;
}

export async function createGuest(username: string) {
  const db = await getDb();
  const [user] = await db.insert(users).values({ username }).returning();
  const raw = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    id: sha(raw),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
  });
  return { user, raw };
}

const NONCE_MINUTES = 5;

export async function createWalletChallenge(chain: Chain, address: string, origin: string) {
  const db = await getDb();
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + NONCE_MINUTES * 60_000);
  await db.insert(walletNonces).values({ nonce, chain, address, origin, issuedAt, expiresAt });
  return { nonce, message: buildMessage({ chain, address, origin, nonce, issuedAt, expiresAt }) };
}

// Verifies a signed challenge and resolves which account the wallet maps to:
//  - wallet already has an account  -> sign in as that account
//  - signed in as a guest, wallet new -> link the wallet to the guest (keeps its node)
//  - otherwise                        -> create a fresh account for the wallet
export async function completeWalletLogin(nonce: string, signature: string, currentUserId: number | null) {
  const db = await getDb();
  const [row] = await db
    .update(walletNonces)
    .set({ usedAt: new Date() })
    .where(and(eq(walletNonces.nonce, nonce), isNull(walletNonces.usedAt), gt(walletNonces.expiresAt, new Date())))
    .returning();
  if (!row || !isChain(row.chain)) return { ok: false as const, error: "this sign-in request expired, try again" };

  const message = buildMessage({ chain: row.chain, address: row.address, origin: row.origin, nonce: row.nonce, issuedAt: row.issuedAt, expiresAt: row.expiresAt });
  if (!(await verifySignature(row.chain, row.address, message, signature))) return { ok: false as const, error: "signature did not verify" };

  const key = accountKey(row.chain, row.address);
  const [owner] = await db.select().from(users).where(eq(users.walletAddress, key));
  if (owner) {
    if (currentUserId === owner.id) return { ok: true as const, user: owner, raw: null, linked: false };
    return { ok: true as const, user: owner, raw: await newSession(owner.id), linked: false };
  }
  if (currentUserId != null) {
    const [linked] = await db
      .update(users)
      .set({ walletAddress: key })
      .where(and(eq(users.id, currentUserId), isNull(users.walletAddress)))
      .returning();
    if (linked) return { ok: true as const, user: linked, raw: null, linked: true };
  }
  const [created] = await db.insert(users).values({ username: shortAddress(key), walletAddress: key }).returning();
  return { ok: true as const, user: created, raw: await newSession(created.id), linked: false };
}

async function newSession(userId: number): Promise<string> {
  const db = await getDb();
  const raw = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({ id: sha(raw), userId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000) });
  return raw;
}

export async function setSessionCookie(raw: string) {
  (await cookies()).set(COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function clearSession() {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, sha(raw)));
  }
  store.delete(COOKIE);
}

export async function getSessionUser() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: users.id, username: users.username, walletAddress: users.walletAddress })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha(raw)), gt(sessions.expiresAt, new Date())));
  return row ?? null;
}
