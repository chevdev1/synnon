"use client";

import { useDemo } from "@/lib/demo";
import { useHelp } from "@/lib/help";
import { LIVE_MIN, useLiveStats } from "@/lib/liveStats";

// One line under the goal bar that says how alive the REAL brain is, and what to do about it:
// in the demo it offers the switch to Live; in a quiet Live it invites friends.
export default function LiveInvite() {
  const { on: demo, toggle } = useDemo();
  const { known, taken, total } = useLiveStats();
  const { lang } = useHelp();
  if (!known) return null;
  const T = (en: string, ru: string) => (lang === "ru" ? ru : en);
  const quiet = taken < LIVE_MIN;

  const shareUrl = typeof window === "undefined" ? "" : window.location.origin;
  const text = T("128 voices, one mind. Claim one of the first cells in SYNNOD.", "128 голосов, один разум. Займи одну из первых клеток в SYNNOD.");

  return (
    <div className="mt-2 flex items-center gap-2 text-[15px] leading-snug text-[var(--text-2)]" data-live-invite>
      <span className="h-2 w-2 shrink-0" style={{ background: quiet ? "#ffd166" : "var(--lime)" }} />
      <span className="min-w-0 flex-1">
        {T("Live", "Live")}: {taken}/{total} {T("voices", "голосов")}
        {demo ? "" : quiet ? ` · ${T("just starting", "только начинается")}` : ""}
      </span>
      {demo ? (
        <button type="button" onClick={toggle} className="font-head shrink-0 border border-[var(--lime)] px-1.5 py-1 text-[6px] uppercase text-[var(--lime)] hover:bg-[var(--lime)] hover:text-[#06071a]" data-live-go>
          {T("go live", "в live")}
        </button>
      ) : quiet ? (
        <a
          href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noreferrer"
          className="font-head shrink-0 border border-[#ffd166] px-1.5 py-1 text-[6px] uppercase text-[#ffd166] hover:bg-[#ffd166] hover:text-[#06071a]"
          data-live-invite-share
        >
          {T("invite", "позвать")}
        </a>
      ) : null}
    </div>
  );
}
