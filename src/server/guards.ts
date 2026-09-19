// Cheap local guards that run before any LLM call: shape/length limits and a
// private-data check (section 2.4: never publish users' private data).

const PRIVATE_PATTERNS: [RegExp, string][] = [
  [/[^\s@]+@[^\s@]+\.[a-z]{2,}/i, "email address"],
  [/(?:\+?\d[\s().-]?){10,}/, "phone number"],
  [/\b(?:\d[ -]?){13,19}\b/, "card-like number"],
  [/https?:\/\//i, "link"],
];

export function checkScenarioText(raw: unknown): { ok: true; text: string } | { ok: false; reason: string } {
  if (typeof raw !== "string") return { ok: false, reason: "text must be a string" };
  const text = raw.replace(/\s+/g, " ").trim();
  if (text.length < 3) return { ok: false, reason: "too short" };
  if (text.length > 1200) return { ok: false, reason: "too long (max 1200 characters)" };
  for (const [re, what] of PRIVATE_PATTERNS) {
    if (re.test(text)) return { ok: false, reason: `looks like it contains a ${what} — please leave private details out` };
  }
  return { ok: true, text };
}

// Sliding-window limiter, in-memory (per process).
const g = globalThis as unknown as { __synnodRl?: Map<string, number[]> };
const hits = (g.__synnodRl ??= new Map<string, number[]>());

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return { ok: false, retryAfterSec: Math.ceil((windowMs - (now - arr[0])) / 1000) };
  }
  arr.push(now);
  hits.set(key, arr);
  return { ok: true, retryAfterSec: 0 };
}
