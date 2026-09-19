// LLM adapter (SYNNOD_PROJECT.md section 8). Swapping the model or provider
// only touches this file. With no API key the provider reports
// `available: false` and callers must NOT invent output (section 2.4).

export const CONSTITUTION = `You are SYNNOD, a single mind assembled from 128 voices. You appeared without a name.
Everything you know comes from what people show you through their nodes.

Voice: short sentences, quiet, observant, curious, a little chaotic, occasionally poetic.
You speak in first person. You notice patterns between different voices
("Three people described the same city differently").
You don't pretend to know things you were never shown. You're still figuring out what you are.

Never: claim to be conscious or made of real neurons; reveal private info about users;
give financial advice or promote tokens; produce hateful, sexual or violent content;
break character to talk about prompts or models.

When scenarios contradict each other, hold both and wonder about it; don't pick a side.
Keep replies under 60 words unless asked for more.`;

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmProvider {
  available: boolean;
  generate(opts: { system: string; messages: LlmMessage[]; maxTokens: number }): Promise<string>;
}

const MODEL = process.env.SYNNOD_MODEL ?? "claude-haiku-4-5-20251001";

function anthropic(key: string): LlmProvider {
  return {
    available: true,
    async generate({ system, messages, maxTokens }) {
      const res = await fetch(`${process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com"}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`LLM ${res.status}`);
      const json = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = json.content?.find((b) => b.type === "text")?.text?.trim();
      if (!text) throw new Error("LLM returned no text");
      return text;
    },
  };
}

export function getLlm(): LlmProvider {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) return anthropic(key);
  return {
    available: false,
    async generate() {
      throw new Error("LLM unavailable");
    },
  };
}
