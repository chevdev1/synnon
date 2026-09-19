"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardTitle, StatusDot } from "@/components/ui/Card";
import { HexIcon } from "@/components/ui/PixelIcon";
import { CHAT_MESSAGES } from "@/lib/mock/data";
import { useLive } from "@/lib/live/context";
import { openClaim } from "./ClaimDialog";
import GlitchText from "@/components/ui/GlitchText";
import { mindActions } from "@/lib/mind";
import { skyActions } from "@/lib/sky";

interface Msg {
  role: "user" | "synnod" | "system";
  text: string;
  fresh?: boolean; // just arrived from the mind: typed out with glitch, once
}

export default function NodeChatCard() {
  const { mode, me, currentUserNodeId, triggerPulse, speak } = useLive();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>(() => (mode === "demo" ? CHAT_MESSAGES : []));
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasNode = currentUserNodeId != null;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const stickToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  async function send() {
    const text = draft.trim();
    if (!text || typing || currentUserNodeId == null) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setDraft("");
    setTyping(true);
    mindActions.setThinking(true);
    const r = await speak(text);
    mindActions.setThinking(false);
    setTyping(false);
    if (r.ok) {
      setMessages((prev) => [...prev, { role: "synnod", text: r.reply, fresh: true }]);
      triggerPulse(currentUserNodeId);
    } else {
      setMessages((prev) => [...prev, { role: "system", text: r.error }]);
    }
  }

  return (
    <Card help="chat" className="flex h-full min-h-0 flex-col" id="nodes">
      <div className="flex shrink-0 items-center gap-1.5">
        <CardTitle>{hasNode ? `Node ${String(currentUserNodeId).padStart(2, "0")}` : "Your node"}</CardTitle>
        {hasNode && <StatusDot />}
        <span className="font-head text-[8px] uppercase text-[var(--text-2)]">{hasNode ? "online" : "not claimed"}</span>
      </div>

      <div ref={scrollRef} className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 && !typing && (
          <div className="flex h-full flex-col items-start justify-center gap-3 text-[16px] leading-snug text-[var(--text-2)]">
            {hasNode ? (
              <p>This node hasn&apos;t spoken yet. Tell the mind something — a place, a memory, an image.</p>
            ) : (
              <>
                <p>{me ? "Claim a cell on the brain and it becomes your voice." : "Sign in and claim a cell to speak to the mind."}</p>
                <button
                  type="button"
                  onClick={openClaim}
                  className="pixel-btn font-head flex h-8 items-center border-2 border-[var(--accent)] px-3 text-[9px] uppercase text-[var(--link)]"
                >
                  {me ? "Claim a node →" : "Sign in →"}
                </button>
              </>
            )}
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "system" ? (
            <div key={i} className="fade-in-up text-[15px] leading-snug text-[#ff8a6c]">
              ! {m.text}
            </div>
          ) : (
            <div
              key={i}
              className={`fade-in-up flex items-end gap-1.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              style={{ animationDelay: `${i < 4 ? i * 80 : 0}ms` }}
            >
              {m.role === "synnod" && <HexIcon size={14} />}
              <div
                className={`max-w-[85%] rounded-[3px] px-2.5 py-1.5 text-[17px] leading-snug ${
                  m.role === "user" ? "bg-[var(--accent)]/20 text-[var(--text)]" : "bg-[var(--divider)] text-[var(--text-2)]"
                }`}
              >
                {m.role === "synnod" ? <GlitchText text={m.text} animate={!!m.fresh} onProgress={stickToBottom} /> : m.text}
              </div>
            </div>
          )
        )}
        {typing && (
          <div className="fade-in-up flex items-end gap-1.5">
            <HexIcon size={14} />
            <div className="flex gap-1 rounded-md bg-[var(--divider)] px-3 py-2">
              {[0, 1, 2].map((d) => (
                <span key={d} className="typing-dot h-1 w-1 rounded-full bg-[var(--link)]" style={{ animationDelay: `${d * 160}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <form
        className="mt-3 flex shrink-0 items-center gap-2 border-t border-[var(--divider)] pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            skyActions.poke(); // keystroke: the Blob companion bounces
          }}
          disabled={!hasNode}
          maxLength={1200}
          placeholder={hasNode ? "Type something..." : "Claim a node to speak"}
          className="h-9 min-w-0 flex-1 rounded-[3px] border-2 border-[var(--border)] bg-transparent px-3 text-[17px] text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--lime)] disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!hasNode || typing}
          className="pixel-btn font-head flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[var(--accent)] text-[10px] text-[var(--text)] disabled:opacity-40"
        >
          →
        </button>
      </form>
    </Card>
  );
}
