// LLM adapter (SYNNOD_PROJECT.md section 8). Swapping the model or provider
// only touches this file (and env vars). With no key the provider reports
// `available: false` and callers must NOT invent output (section 2.4).
//
// Free options that need no credit card (a key is still required, it is free):
//   LLM_PROVIDER=gemini      Google AI Studio  -> https://aistudio.google.com/apikey
//   LLM_PROVIDER=groq        Groq              -> https://console.groq.com/keys
//   LLM_PROVIDER=openrouter  OpenRouter ":free" models -> https://openrouter.ai/keys
// Anything else that speaks the OpenAI chat-completions protocol works via
// LLM_PROVIDER=openai + LLM_BASE_URL. Anthropic is supported via ANTHROPIC_API_KEY.

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
  label: string;
  generate(opts: { system: string; messages: LlmMessage[]; maxTokens: number }): Promise<string>;
}

interface Preset {
  baseUrl: string;
  model: string;
  extra?: Record<string, unknown>;
}

// Free-tier model names drift over time; override with LLM_MODEL when they do.
const PRESETS: Record<string, Preset> = {
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash",
    // Reasoning tokens would otherwise eat the small max_tokens budgets we use.
    extra: { reasoning_effort: "none" },
  },
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free" },
};

async function post(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  return res.json();
}

function openaiCompatible(label: string, baseUrl: string, key: string, model: string, extra: Record<string, unknown> = {}): LlmProvider {
  return {
    available: true,
    label,
    async generate({ system, messages, maxTokens }) {
      const json = (await post(
        `${baseUrl.replace(/\/$/, "")}/chat/completions`,
        { authorization: `Bearer ${key}` },
        { model, max_tokens: maxTokens, messages: [{ role: "system", content: system }, ...messages], ...extra }
      )) as { choices?: { message?: { content?: string | null } }[] };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("LLM returned no text");
      return text;
    },
  };
}

function anthropic(key: string): LlmProvider {
  const model = process.env.LLM_MODEL ?? process.env.SYNNOD_MODEL ?? "claude-haiku-4-5-20251001";
  const base = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";
  return {
    available: true,
    label: `anthropic:${model}`,
    async generate({ system, messages, maxTokens }) {
      const json = (await post(
        `${base}/v1/messages`,
        { "x-api-key": key, "anthropic-version": "2023-06-01" },
        { model, max_tokens: maxTokens, system, messages }
      )) as { content?: { type: string; text?: string }[] };
      const text = json.content?.find((b) => b.type === "text")?.text?.trim();
      if (!text) throw new Error("LLM returned no text");
      return text;
    },
  };
}

export function getLlm(): LlmProvider {
  const key = process.env.LLM_API_KEY;
  if (key) {
    const name = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
    const preset = PRESETS[name];
    const baseUrl = process.env.LLM_BASE_URL ?? preset?.baseUrl;
    const model = process.env.LLM_MODEL ?? preset?.model;
    if (baseUrl && model) return openaiCompatible(`${name}:${model}`, baseUrl, key, model, preset?.extra);
    console.error(`[llm] LLM_PROVIDER=${name} needs LLM_BASE_URL and LLM_MODEL`);
  }
  const claude = process.env.ANTHROPIC_API_KEY;
  if (claude) return anthropic(claude);
  return {
    available: false,
    label: "none",
    async generate() {
      throw new Error("LLM unavailable");
    },
  };
}
