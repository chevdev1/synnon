import { date, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// SYNNOD_PROJECT.md section 9, plus the two auth tables the magic-link flow needs.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").unique(), // unused for guests; reserved for later
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nodes = pgTable("nodes", {
  id: integer("id").primaryKey(), // 1..128
  slug: text("slug").notNull(),
  label: text("label").notNull(),
  status: text("status").notNull().default("available"), // available|claimed|active|memory|featured
  ownerUserId: integer("owner_user_id").references(() => users.id),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  gridRow: integer("grid_row").notNull(),
  gridCol: integer("grid_col").notNull(),
});

export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  nodeId: integer("node_id").notNull().references(() => nodes.id),
  authorUserId: integer("author_user_id").notNull().references(() => users.id),
  rawText: text("raw_text").notNull(),
  title: text("title").notNull(),
  moderationStatus: text("moderation_status").notNull().default("pending"), // pending|approved|rejected
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const outputs = pgTable("outputs", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => scenarios.id),
  nodeId: integer("node_id").references(() => nodes.id),
  triggerType: text("trigger_type").notNull(), // scenario|autonomous
  text: text("text").notNull(),
  visualStateJson: jsonb("visual_state_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memoryState = pgTable("memory_state", {
  id: serial("id").primaryKey(),
  summaryText: text("summary_text").notNull().default(""),
  recentOutputIds: integer("recent_output_ids").array().notNull().default([]),
  characterStateJson: jsonb("character_state_json"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const thoughts = pgTable("thoughts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  sourceOutputIds: integer("source_output_ids").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One entry per UTC day, written by the mind itself from what really happened that day.
export const diary = pgTable("diary", {
  id: serial("id").primaryKey(),
  day: date("day", { mode: "string" }).notNull().unique(), // YYYY-MM-DD (UTC)
  title: text("title").notNull(),
  body: text("body").notNull(),
  nodeIds: integer("node_ids").array().notNull().default([]), // cells that spoke that day, most active first
  voices: integer("voices").notNull().default(0), // distinct cells that spoke
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the cookie value
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// One-time sign-in challenges for wallet auth (EVM personal_sign / Solana signMessage).
export const walletNonces = pgTable("wallet_nonces", {
  nonce: text("nonce").primaryKey(),
  chain: text("chain").notNull(), // evm | sol
  address: text("address").notNull(), // normalised (evm lower-case)
  origin: text("origin").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});
