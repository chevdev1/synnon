export const json = (data: unknown, status = 200) => Response.json(data, { status });
export const fail = (status: number, error: string, extra?: Record<string, unknown>) =>
  Response.json({ error, ...extra }, { status });

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
