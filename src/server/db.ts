import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleLite } from "drizzle-orm/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { count } from "drizzle-orm";
import { Pool } from "pg";
import { generateBrain } from "@/lib/brain/generate";
import * as schema from "./schema";
// Schema is plain Postgres, so the same DDL runs on PGlite (local) and a real server.
const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY, username text NOT NULL, email text UNIQUE,
  wallet_address text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS nodes (
  id integer PRIMARY KEY, slug text NOT NULL, label text NOT NULL,
  status text NOT NULL DEFAULT 'available', owner_user_id integer REFERENCES users(id),
  claimed_at timestamptz, last_active_at timestamptz, grid_row integer NOT NULL, grid_col integer NOT NULL);
CREATE TABLE IF NOT EXISTS scenarios (
  id serial PRIMARY KEY, node_id integer NOT NULL REFERENCES nodes(id),
  author_user_id integer NOT NULL REFERENCES users(id), raw_text text NOT NULL, title text NOT NULL,
  moderation_status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS outputs (
  id serial PRIMARY KEY, scenario_id integer REFERENCES scenarios(id), node_id integer REFERENCES nodes(id),
  trigger_type text NOT NULL, text text NOT NULL, visual_state_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS memory_state (
  id serial PRIMARY KEY, summary_text text NOT NULL DEFAULT '',
  recent_output_ids integer[] NOT NULL DEFAULT '{}', character_state_json jsonb,
  updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS thoughts (
  id serial PRIMARY KEY, text text NOT NULL, source_output_ids integer[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_uidx ON users (wallet_address);
CREATE TABLE IF NOT EXISTS wallet_nonces (
  nonce text PRIMARY KEY, chain text NOT NULL, address text NOT NULL, origin text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, used_at timestamptz);
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id), expires_at timestamptz NOT NULL);
`;

export const INITIAL_CHARACTER = {
  name: "SYNNOD",
  traits: ["Curious", "Observant", "A little chaotic", "Still figuring things out"],
  mood: "curious",
  quote: "I don't know what I am. But I'm glad you're here.",
};

type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
const g = globalThis as unknown as { __synnodDb?: Promise<Db>; __synnodPool?: Pool };

// DATABASE_URL (Neon, Supabase, any Postgres) is used when set. Otherwise the
// embedded PGlite keeps everything in a local folder, which is perfect for
// development but cannot persist on serverless hosts like Vercel.
async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const pool = (g.__synnodPool ??= new Pool({ connectionString: url, max: 3 }));
    // Advisory lock so concurrent cold starts don't race on CREATE TABLE.
    const c = await pool.connect();
    try {
      await c.query("SELECT pg_advisory_lock(727001)");
      await c.query(DDL);
    } finally {
      await c.query("SELECT pg_advisory_unlock(727001)").catch(() => {});
      c.release();
    }
    return drizzlePg(pool, { schema }) as unknown as Db;
  }

  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set. Serverless hosts need a real Postgres (e.g. Neon); the embedded database can't persist there.");
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.SYNNOD_DB_DIR ?? ".data/synnod";
  mkdirSync(dirname(dir), { recursive: true });
  const client = new PGlite(dir);
  await client.exec(DDL);
  return drizzleLite(client, { schema }) as unknown as Db;
}

async function init(): Promise<Db> {
  const db = await connect();

  const [{ value: nodeCount }] = await db.select({ value: count() }).from(schema.nodes);
  if (nodeCount === 0) {
    const cells = generateBrain()
      .cells.filter((c) => c.claimId != null)
      .sort((a, b) => a.claimId! - b.claimId!);
    await db
      .insert(schema.nodes)
      .values(
        cells.map((c) => ({
          id: c.claimId!,
          slug: `node-${String(c.claimId).padStart(3, "0")}`,
          label: `Node ${String(c.claimId).padStart(2, "0")}`,
          gridRow: c.row,
          gridCol: c.col,
        }))
      )
      .onConflictDoNothing();
  }
  // Fixed id so two racing cold starts can't create two memory rows.
  await db
    .insert(schema.memoryState)
    .values({ id: 1, summaryText: "", characterStateJson: INITIAL_CHARACTER })
    .onConflictDoNothing();
  return db;
}

export function getDb(): Promise<Db> {
  // Cached on globalThis so dev hot-reloads don't open the database twice.
  if (!g.__synnodDb) {
    g.__synnodDb = init().catch((e) => {
      g.__synnodDb = undefined; // don't cache a failed start
      throw e;
    });
  }
  return g.__synnodDb;
}