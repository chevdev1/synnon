import { listNodes } from "@/server/service";
import { json } from "@/server/http";

export async function GET() {
  const rows = await listNodes();
  const stats = { total: rows.length, active: 0, memory: 0, claimed: 0, available: 0 };
  for (const n of rows) {
    if (n.status === "available") stats.available++;
    else if (n.status === "claimed") stats.claimed++;
    else if (n.status === "memory") stats.memory++;
    else stats.active++; // active + featured
  }
  return json({
    nodes: rows.map((n) => ({ id: n.id, status: n.status, label: n.label, ownerName: n.ownerName })),
    stats,
  });
}
