import { subscribe } from "@/server/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const enc = new TextEncoder();
  let unsub = () => {};
  let ping: ReturnType<typeof setInterval>;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          /* client went away */
        }
      };
      send("retry: 3000\n\n");
      unsub = subscribe((e) => send(`event: ${e.type}\ndata: ${JSON.stringify(e.data)}\n\n`));
      ping = setInterval(() => send(": ping\n\n"), 25_000);
      req.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(ping);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      });
    },
    cancel() {
      unsub();
      clearInterval(ping);
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive" },
  });
}
