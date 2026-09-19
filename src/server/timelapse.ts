import { and, eq, gte, inArray, isNotNull, lt } from "drizzle-orm";
import { getDb } from "./db";
import { nodes, outputs, thoughts } from "./schema";
import { MIN_EVENTS, type TlEvent, type Timelapse } from "@/lib/timelapse";

const MAX_EVENTS = 500;

async function collect(from: Date) {
  const db = await getDb();
  const claims = await db.select({ id: nodes.id, t: nodes.claimedAt }).from(nodes).where(and(isNotNull(nodes.claimedAt), gte(nodes.claimedAt, from)));
  const voices = await db
    .select({ node: outputs.nodeId, t: outputs.createdAt })
    .from(outputs)
    .where(and(eq(outputs.triggerType, "scenario"), isNotNull(outputs.nodeId), gte(outputs.createdAt, from)));
  const ts = await db.select({ t: thoughts.createdAt, src: thoughts.sourceOutputIds }).from(thoughts).where(gte(thoughts.createdAt, from));

  // thoughts remember output ids; the timelapse needs the cells behind them
  const srcIds = [...new Set(ts.flatMap((x) => x.src))].slice(0, 800);
  const owner = new Map<number, number>();
  if (srcIds.length) for (const o of await db.select({ id: outputs.id, node: outputs.nodeId }).from(outputs).where(inArray(outputs.id, srcIds))) if (o.node != null) owner.set(o.id, o.node);

  const events: TlEvent[] = [];
  for (const c of claims) if (c.t) events.push({ t: c.t.getTime(), type: "claim", node: c.id });
  for (const v of voices) if (v.node != null) events.push({ t: v.t.getTime(), type: "voice", node: v.node });
  for (const x of ts) {
    const cells = [...new Set(x.src.map((s) => owner.get(s)).filter((n): n is number => n != null))];
    if (cells.length >= 2) events.push({ t: x.t.getTime(), type: "thought", node: cells[0], links: cells.slice(1, 4) });
  }
  events.sort((a, b) => a.t - b.t);
  return events.slice(-MAX_EVENTS);
}

// Last 24 hours; if that is too quiet to be worth watching, the whole history.
export async function getTimelapse(): Promise<Timelapse> {
  const db = await getDb();
  const to = new Date();
  const from24 = new Date(to.getTime() - 24 * 3600_000);
  let events = await collect(from24);
  let range: Timelapse["range"] = "24h";
  if (events.length < MIN_EVENTS) {
    events = await collect(new Date(0));
    range = "all";
  }
  // Fit the timeline to the period when things actually happened (plus a little air).
  // Otherwise a young mind whose whole history is the last minute would play 24 hours
  // of empty sky and only wake up in the final second.
  const now = to.getTime();
  const first = events[0]?.t ?? now - 60_000;
  const last = events[events.length - 1]?.t ?? now;
  const pad = Math.max((last - first) * 0.06, 20_000);
  const fromMs = Math.max(range === "24h" ? from24.getTime() : 0, first - pad);
  const toMs = Math.min(now, last + pad);
  const pre = range === "all" ? [] : (await db.select({ id: nodes.id }).from(nodes).where(and(isNotNull(nodes.claimedAt), lt(nodes.claimedAt, new Date(fromMs))))).map((n) => n.id);
  return { from: fromMs, to: Math.max(toMs, fromMs + 1000), range, pre, events };
}
