"use client";

import { HexIcon } from "@/components/ui/PixelIcon";
import { StatusDot } from "@/components/ui/Card";
import { formatAgo } from "@/lib/live/format";
import { useLive } from "@/lib/live/context";
import type { NodeProfile } from "@/lib/nodeProfile";
import MiniBrain from "./MiniBrain";

const STATUS_COLOR: Record<string, string> = {
  available: "var(--muted)",
  claimed: "#ffd166",
  active: "var(--lime)",
  memory: "#b9a6f5",
  featured: "#ff9be0",
};
const STATUS_TEXT: Record<string, string> = {
  available: "free: nobody's voice yet",
  claimed: "claimed, waiting for its first words",
  active: "speaking right now",
  memory: "holds a memory",
  featured: "featured by the mind",
};

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border-2 border-[var(--border)] bg-[#0b0a1f] p-2.5" title={hint}>
      <div className="font-head text-[7px] uppercase leading-relaxed text-[var(--muted)]">{label}</div>
      <div className="font-head mt-1.5 text-[14px] text-[var(--lime)]">{value}</div>
    </div>
  );
}

// 20 pixel blocks; the share is small for most cells, so a non-zero share always lights at least one.
function ShareBar({ pct }: { pct: number }) {
  const lit = pct <= 0 ? 0 : Math.max(1, Math.round((Math.min(pct, 25) / 25) * 20));
  return (
    <div className="flex gap-[3px]" role="img" aria-label={`${pct}% of the mind's answers`}>
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className="h-3 flex-1" style={{ background: i < lit ? "var(--lime)" : "var(--border)", opacity: i < lit ? 0.35 + (i / 20) * 0.65 : 0.5 }} />
      ))}
    </div>
  );
}

export default function NodeProfileView({ profile, compact = false }: { profile: NodeProfile; compact?: boolean }) {
  const { me, now } = useLive();
  const { node, stats, history } = profile;
  const mine = me?.nodeId === node.id;
  const color = STATUS_COLOR[node.status] ?? "var(--muted)";
  const t = Math.max(now, node.lastActiveAt ?? 0, ...history.map((h) => h.ts));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
          <HexIcon size={compact ? 34 : 44} color={color} />
        </span>
        <div className="min-w-0">
          <div className="font-head flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] uppercase">
            <span className="text-[var(--text-2)]">{`Node ${String(node.id).padStart(2, "0")}`}</span>
            <span className="flex items-center gap-1.5" style={{ color }}>
              <StatusDot color={color} />
              {node.status}
            </span>
            {mine && <span className="border border-[var(--lime)] px-1.5 py-0.5 text-[7px] text-[var(--lime)]">your node</span>}
          </div>
          <div className="mt-1.5 truncate text-[22px] leading-none text-[var(--text)]">{node.ownerName ?? "no voice yet"}</div>
          <div className="mt-1 text-[16px] leading-snug text-[var(--muted)]">
            {STATUS_TEXT[node.status] ?? node.status}
            {node.claimedAt ? ` · claimed ${formatAgo(node.claimedAt, t)}` : ""}
            {node.lastActiveAt ? ` · last spoke ${formatAgo(node.lastActiveAt, t)}` : ""}
          </div>
        </div>
      </div>

      <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"}`}>
        <Tile label="Voices" value={String(stats.voices)} hint="Scenarios told through this cell and accepted by moderation" />
        <Tile label="In memory now" value={String(stats.inMemory)} hint="Replies that are still part of the mind's recent memory" />
        <Tile label="Thoughts shaped" value={String(stats.thoughtsShaped)} hint="Autonomous thoughts that drew on this cell's words" />
        <Tile label="Share of mind" value={`${stats.sharePct}%`} hint="Share of everything the mind has answered so far" />
      </div>

      <div>
        <div className="font-head mb-1.5 text-[8px] uppercase text-[var(--muted)]">Influence on the mind</div>
        <ShareBar pct={stats.sharePct} />
      </div>

      <div>
        <div className="font-head mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] uppercase text-[var(--muted)]">
          Where it sits
          <span className="flex items-center gap-1 text-[var(--lime)]">
            <span className="h-2 w-2 bg-[var(--lime)]" /> this cell
          </span>
          {profile.links.length > 0 && (
            <span className="flex items-center gap-1 text-[var(--cell-pink)]">
              <span className="h-2 w-2 bg-[var(--cell-pink)]" /> shares thoughts with {profile.links.length}
            </span>
          )}
        </div>
        <MiniBrain id={node.id} links={profile.links} />
      </div>

      <div>
        <div className="font-head mb-2 text-[9px] uppercase text-[var(--text)]">History of influence</div>
        {history.length === 0 ? (
          <p className="border-2 border-dashed border-[var(--border)] p-3 text-[17px] leading-snug text-[var(--muted)]">
            {node.status === "available"
              ? "Nothing here yet. Whoever claims this cell writes the first line."
              : "This voice hasn't told the mind anything yet. The first scenario will show up here."}
          </p>
        ) : (
          <ol className="relative space-y-3 border-l-2 border-[var(--border)] pl-4">
            {history.map((h) => (
              <li key={`${h.kind}-${h.id}`} className="relative">
                <span
                  className="absolute -left-[22px] top-1.5 h-2.5 w-2.5"
                  style={{ background: h.kind === "voice" ? "var(--accent)" : "var(--lime)", boxShadow: `0 0 6px ${h.kind === "voice" ? "var(--accent)" : "var(--lime)"}` }}
                />
                {h.kind === "voice" ? (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-x-2 text-[15px] text-[var(--faint)]">
                      <span className="font-head text-[7px] uppercase text-[var(--link)]">voice</span>
                      {formatAgo(h.ts, t)}
                      {h.inMemory && <span className="font-head border border-[#b9a6f5] px-1 py-px text-[7px] uppercase text-[#b9a6f5]">in memory now</span>}
                    </div>
                    <p className="text-[19px] leading-snug text-[var(--text)]">&ldquo;{h.title}&rdquo;</p>
                    {h.reply && (
                      <p className="border-l-2 border-[var(--accent)] bg-[#0b0a1f] px-2.5 py-1.5 text-[17px] leading-snug text-[var(--text-2)]">
                        <span className="font-head mr-1.5 text-[7px] uppercase text-[var(--cell-pink)]">mind</span>
                        {h.reply}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[15px] text-[var(--faint)]">
                      <span className="font-head text-[7px] uppercase text-[var(--lime)]">thought it shaped</span>
                      {formatAgo(h.ts, t)}
                    </div>
                    <p className="text-[18px] italic leading-snug text-[var(--lime)]">{h.text}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
