// In-process pub/sub behind /api/stream (SSE). Fine for a single Node
// process; swap for Redis pub/sub when this runs on more than one instance.
export type ServerEvent =
  | { type: "node.updated"; data: { id: number; status: string } }
  | { type: "output.created"; data: { id: number; nodeId: number | null; text: string; trigger: string } }
  | { type: "thought.created"; data: { id: number; text: string; createdAt: string } };

type Listener = (e: ServerEvent) => void;
const g = globalThis as unknown as { __synnodBus?: Set<Listener> };
const bus = (g.__synnodBus ??= new Set<Listener>());

export function subscribe(l: Listener): () => void {
  bus.add(l);
  return () => bus.delete(l);
}

export function publish(e: ServerEvent): void {
  for (const l of bus) {
    try {
      l(e);
    } catch {
      /* one bad subscriber must not break the others */
    }
  }
}
