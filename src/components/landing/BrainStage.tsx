"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BrainCanvasClient from "@/components/brain/BrainCanvasClient";
import { StatusDot } from "@/components/ui/Card";
import { useLive } from "@/lib/live/context";
import { formatAgo } from "@/lib/live/format";
import { openClaim } from "./ClaimDialog";
import { openNode } from "./NodeSheet";
import NodeSearch from "./NodeSearch";
import TimelapseBar from "./TimelapseBar";
import ClockChip from "./ClockChip";
import { useResonance } from "@/lib/useResonance";
import NotifyBell from "@/components/notify/NotifyBell";
import { notifyActions } from "@/lib/notify";
import { bondActions, useBond } from "@/lib/petBond";
import { useTimelapse } from "./useTimelapse";
import PixelFace from "@/components/ui/PixelFace";
import { skyActions } from "@/lib/sky";
import { achActions, useAch } from "@/lib/achStore";
import { questActions } from "@/lib/questStore";
import { PET_BY_ID, usePet } from "@/lib/pets";
import { useStage } from "@/lib/useStage";
import PetPicker from "./PetPicker";
import CommandConsole from "./CommandConsole";
import { useMind } from "@/lib/mind";
import { sfx } from "@/lib/sfx";
import { useDemo } from "@/lib/demo";

// Deterministic (no Math.random) so SSR and client markup match.
const MOTES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37.7 + 11) % 100,
  top: (i * 53.3 + 7) % 100,
  size: 1 + (i % 3),
  dur: 9 + ((i * 7) % 11),
  delay: -((i * 3.1) % 12),
  color: i % 4 === 0 ? "#bfe6ff" : i % 4 === 1 ? "#d674dc" : "#8a5ce0",
}));

export default function BrainStage() {
  const demo = useDemo();
  const { mode, offline, nodes, me, currentUserNodeId, selectedId, setSelectedId, pulseEvent, events, now } = useLive();
  const { state: mindState, mood, dreaming } = useMind();
  const stg = useStage();
  const parallaxBusy = useRef(false);
  const pairs = useResonance(demo.on, nodes, currentUserNodeId);
  const [rIdx, setRIdx] = useState(0);
  useEffect(() => {
    if (pairs.length < 2) return;
    const id = window.setInterval(() => setRIdx((i) => i + 1), 10000);
    return () => window.clearInterval(id);
  }, [pairs.length]);
  const shownPair = pairs.length ? pairs[rIdx % pairs.length] : null;
  const pairList = useMemo(() => pairs.map((p) => [p.a, p.b] as [number, number]), [pairs]);
  const { id: petId } = usePet();
  const { unlocked } = useAch();
  const chosenPet = petId ? PET_BY_ID.get(petId) : undefined;
  const warp = chosenPet?.id === "comet" && !!unlocked[chosenPet.needs ?? ""]; // the Comet's perk: 8x timelapse
  const tl = useTimelapse(warp);
  const chosen = chosenPet;
  const petActive = chosen && (!chosen.needs || unlocked[chosen.needs]) ? chosen : null;
  const bond = useBond(petActive?.id ?? null);
  const petSprite = petActive ? { id: petActive.id, rows: petActive.rows, color: petActive.color, stage: bond.stage } : null;
  const petActiveId = petActive?.id ?? null;
  useEffect(() => {
    if (petActiveId) bondActions.touch(petActiveId); // one more day together, once a day
  }, [petActiveId]);

  // Notifications from things this browser really saw: a resonance with your cell...
  useEffect(() => {
    if (currentUserNodeId == null) return;
    for (const p of pairs) {
      if (p.a !== currentUserNodeId && p.b !== currentUserNodeId) continue;
      const other = p.a === currentUserNodeId ? p.b : p.a;
      const w = p.words.map((x) => `“${x}”`).join(", ");
      notifyActions.push({
        kind: "resonance",
        key: `res-${Math.min(p.a, p.b)}-${Math.max(p.a, p.b)}`,
        en: `Your cell resonates with cell ${other}: ${w}${demo.on ? " (simulated)" : ""}`,
        ru: `Твоя клетка резонирует с клеткой ${other}: ${w}${demo.on ? " (симуляция)" : ""}`,
      });
    }
  }, [pairs, currentUserNodeId, demo.on]);
  // ...and a thought that grew from your cell
  const lastThoughtNote = useRef(0);
  useEffect(() => {
    if (!pulseEvent || pulseEvent.type !== "thought" || currentUserNodeId == null) return;
    if (pulseEvent.nodeId !== currentUserNodeId && !pulseEvent.links?.includes(currentUserNodeId)) return;
    if (Date.now() - lastThoughtNote.current < 60_000) return;
    lastThoughtNote.current = Date.now();
    notifyActions.push({ kind: "thought", en: `The mind had a thought that grew from your cell${demo.on ? " (simulated)" : ""}.`, ru: `У разума появилась мысль, выросшая из твоей клетки${demo.on ? " (симуляция)" : ""}.` });
  }, [pulseEvent, currentUserNodeId, demo.on]);

  useEffect(() => {
    if (tl.view.phase === "done") achActions.unlock("time-traveler");
  }, [tl.view.phase]);

  // The page-wide sky reacts to the mind: calmer while it sleeps, a swell on every event.
  useEffect(() => {
    skyActions.setDreaming(dreaming && !tl.active);
    return () => skyActions.setDreaming(false);
  }, [dreaming, tl.active]);
  useEffect(() => {
    const p = tl.active ? tl.tlPulse : pulseEvent;
    if (p) skyActions.pulse(p.type === "claim" ? 1 : p.type === "thought" ? 0.7 : 0.45);
  }, [pulseEvent, tl.active, tl.tlPulse]);
  const [ping, setPing] = useState<{ id: number; n: number } | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);

  // The ` key opens the console from anywhere (not while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key === "`" && !(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA"))) {
        e.preventDefault();
        setConsoleOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const activeId = selectedId ?? currentUserNodeId;
  const node = activeId == null ? undefined : nodes.find((n) => n.id === activeId);
  const justPulsed = activeId != null && pulseEvent?.nodeId === activeId;

  // A taken cell opens its profile; a free one opens the claim / connect card.
  function openCell(id: number) {
    setSelectedId(id);
    const taken = nodes.find((n) => n.id === id)?.status;
    if (taken && taken !== "available") {
      openNode(id);
      questActions.event("visit");
    } else openClaim();
  }

  return (
    <div
      className="relative min-h-0 flex-1"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || parallaxBusy.current) return;
        parallaxBusy.current = true; // at most once per frame
        const el = e.currentTarget;
        const { clientX, clientY } = e;
        requestAnimationFrame(() => {
          parallaxBusy.current = false;
          const r = el.getBoundingClientRect();
          el.style.setProperty("--px", ((clientX - r.left) / r.width - 0.5).toFixed(3));
          el.style.setProperty("--py", ((clientY - r.top) / r.height - 0.5).toFixed(3));
        });
      }}
    >
      <div
        aria-hidden
        style={{ transform: "translate(calc(var(--px, 0) * -26px), calc(var(--py, 0) * -20px))", transition: "transform 0.25s ease-out" }}
        className="stage-glow pointer-events-none absolute left-1/2 top-[46%] h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ transform: "translate(calc(var(--px, 0) * 34px), calc(var(--py, 0) * 26px))", transition: "transform 0.3s ease-out" }}>
        {MOTES.map((m, i) => (
          <span
            key={i}
            className="mote absolute rounded-full"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              background: m.color,
              boxShadow: `0 0 ${m.size * 4}px ${m.color}`,
              animationDuration: `${m.dur}s`,
              animationDelay: `${m.delay}s`,
            }}
          />
        ))}
      </div>
      {mode === "api" && offline && (
        <div className="absolute left-1/2 top-4 z-10 w-[min(92%,420px)] -translate-x-1/2 border-2 border-[#ff8a6c] bg-[#0b0a1f]/95 p-3 text-center shadow-[4px_4px_0_rgba(255,138,108,0.35)]">
          <div className="font-head text-[8px] uppercase text-[#ff8a6c]">Live backend not connected</div>
          <p className="mt-2 text-[16px] leading-snug text-[var(--text-2)]">
            This deployment has no database yet, so there is no real data to show. The simulated demo works fully.
          </p>
          <button
            type="button"
            onClick={demo.toggle}
            className="pixel-btn font-head mt-2 h-8 border-2 border-[#ffd166] px-3 text-[8px] uppercase text-[#ffd166]"
          >
            Switch to demo
          </button>
        </div>
      )}
      <BrainCanvasClient
        nodes={tl.tlNodes ?? nodes}
        selectedId={selectedId}
        currentUserNodeId={currentUserNodeId}
        ownName={me?.name ?? null}
        onSelect={(id) => {
          if (tl.active) return; // the timelapse is a replay: no card popping up over it
          sfx.select();
          openCell(id);
        }}
        pulseEvent={tl.active ? tl.tlPulse : pulseEvent}
        ping={ping}
        dreaming={dreaming && !tl.active}
        resonance={tl.active ? undefined : pairList}
        glowHalfLifeMin={tl.active ? 0.06 : undefined}
        pet={petSprite}
      />
      <PetPicker hasCell={currentUserNodeId != null} />
      <button
        type="button"
        data-help-id="console"
        data-console-btn
        onClick={() => setConsoleOpen((o) => !o)}
        aria-pressed={consoleOpen}
        className={`pixel-btn font-head absolute left-4 top-[122px] flex h-7 items-center gap-1 border-2 px-2 text-[7px] uppercase ${consoleOpen ? "border-[var(--lime)] bg-[var(--lime)] text-[#06071a]" : "border-[var(--accent)] bg-[#080a20]/85 text-[var(--link)]"}`}
      >
        &gt;_
      </button>
      <CommandConsole
        open={consoleOpen && !tl.active}
        onClose={() => setConsoleOpen(false)}
        onGoto={(id) => {
          setPing((p) => ({ id, n: (p?.n ?? 0) + 1 }));
          setSelectedId(id);
          window.setTimeout(() => openCell(id), 650);
        }}
      />

      <div className="pointer-events-none absolute right-3 top-3 z-10 flex select-none flex-col items-center gap-1" data-help-id="face">
        <div className="pointer-events-auto cursor-pointer" onClick={() => achActions.bump("eye-contact")} data-face-eye>
          <PixelFace state={mindState} mood={mood} stage={stg.stage.id} className="h-[42px] w-[68px] sm:h-[56px] sm:w-[90px]" />
        </div>
        <span className="font-head text-[6px] uppercase text-[var(--muted)] sm:text-[7px]">
          {mindState === "sleeping" ? "dreaming" : mindState === "thinking" ? "thinking…" : mindState === "speaking" ? "speaking" : mood}
        </span>
      </div>
      <button
        type="button"
        data-help-id="timelapse"
        onClick={() => (tl.active ? tl.stop() : void tl.start())}
        className="pixel-btn font-head absolute right-3 top-[76px] z-10 flex h-7 items-center gap-1 border-2 border-[var(--accent)] bg-[#080a20]/85 px-2 text-[7px] uppercase text-[var(--link)] sm:top-[92px]"
      >
        {tl.active ? "■ Live" : "▶ Timelapse"}
      </button>
      <div className="absolute right-3 top-[110px] z-10 flex items-center gap-1.5 sm:top-[126px]">
        <NotifyBell />
        <ClockChip compact />
      </div>
      {tl.active ? (
        <TimelapseBar view={tl.view} onToggle={tl.togglePause} onSpeed={tl.cycleSpeed} onClose={tl.stop} />
      ) : consoleOpen ? null : (
        <NodeSearch
          onFound={(id) => {
            setPing((p) => ({ id, n: (p?.n ?? 0) + 1 }));
            setSelectedId(id);
            window.setTimeout(() => openCell(id), 650); // let the ping land first
          }}
        />
      )}

      <div className="pointer-events-none absolute left-4 top-4 select-none">
        <div className="font-head text-[9px] text-[var(--muted)]">{`// NODE ${activeId == null ? "--" : String(activeId).padStart(2, "0")}`}</div>
        <div className="font-head mt-1.5 flex items-center gap-1.5 text-[8px] uppercase text-[var(--text-2)]">
          <StatusDot />
          <span className={justPulsed ? "text-[var(--lime)] transition-colors" : "transition-colors"}>
            {node?.status ?? "available"}
          </span>
        </div>
        <div className="mt-1 text-[16px] text-[var(--muted)]">{activeId == null ? "pick a cell" : node?.ownerName ?? (node?.status === "available" ? "unclaimed" : "online")}</div>
      </div>

      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line x1="18" y1="50" x2="34" y2="54" stroke="#3a4180" strokeWidth="0.15" />
        <line x1="78" y1="38" x2="64" y2="44" stroke="#3a4180" strokeWidth="0.15" />
        <line x1="72" y1="78" x2="58" y2="68" stroke="#3a4180" strokeWidth="0.15" />
      </svg>
      <div className="pointer-events-none absolute left-[7%] top-[46%] hidden text-[14px] text-[var(--muted)] lg:block">
        memories grow here
      </div>
      <div className="pointer-events-none absolute right-[8%] top-[34%] hidden text-[14px] text-[var(--muted)] lg:block">
        each cell is a voice
      </div>
      <div className="pointer-events-none absolute bottom-[16%] right-[14%] hidden text-[14px] text-[var(--muted)] lg:block">
        it breathes. it watches.
      </div>

      {!tl.active && !consoleOpen && (
        <ul className="pointer-events-none absolute bottom-3 left-4 space-y-1 text-[16px] text-[var(--muted)]">
          {shownPair && (
            <li key={rIdx} className="fade-in-up mb-2 flex items-center gap-1.5 text-[#ffd166]" data-resonance-caption data-help-id="resonance">
              <span>✦</span>
              <span>
                {String(shownPair.a).padStart(2, "0")} ↔ {String(shownPair.b).padStart(2, "0")} · {shownPair.words.map((w) => `“${w}”`).join(", ")}
                {demo.on ? " (sim)" : ""}
              </span>
            </li>
          )}
          {events.map((e, i) => (
            <li key={e.id} className="fade-in-up flex items-center gap-1.5" style={{ opacity: 1 - i * 0.24 }}>
              <span className="h-1 w-1 rounded-full bg-[var(--lime)]" />
              <span className="uppercase tracking-[0.06em]">{e.text}</span>
              <span className="text-[var(--faint)]">{formatAgo(e.ts, now)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
