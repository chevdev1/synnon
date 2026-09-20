import Link from "next/link";
import { HexIcon } from "@/components/ui/PixelIcon";
import { StatusDot } from "@/components/ui/Card";
import { CLAIMABLE_COUNT } from "@/lib/mock/data";
import MotionToggle from "./MotionToggle";
import DemoToggle from "./DemoToggle";
import MusicToggle from "./MusicToggle";
import TodChip from "./TodChip";
import AchButton from "@/components/achievements/AchButton";
import AuthButton from "./AuthButton";
import HelpButton from "./HelpButton";

const navLink =
  "font-head relative py-1 text-[9px] uppercase text-[var(--text-2)] transition-colors hover:text-[var(--lime)] after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[var(--lime)] after:transition-transform after:duration-150 hover:after:scale-x-100";

export default function Header() {
  return (
    <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-2 border-[var(--divider)] px-5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="drop-shadow-[0_0_6px_rgba(196,242,96,0.55)]">
          <HexIcon size={24} />
        </span>
        <span className="font-head text-[12px] tracking-[0.35em] text-[var(--text)]">SYNNOD</span>
      </div>

      <nav className="hidden items-center gap-7 md:flex">
        <a href="#nodes" className={navLink}>
          Nodes
        </a>
        <a href="#memory" className={navLink}>
          Memory
        </a>
        <a href="#mind" className={navLink}>
          About
        </a>
        <Link href="/question" className={navLink}>
          Question
        </Link>
        <Link href="/diary" className={navLink}>
          Diary
        </Link>
        <Link href="/docs" className={navLink}>
          Docs
        </Link>
      </nav>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <MusicToggle />
        <DemoToggle />
        <MotionToggle />
        <TodChip />
        <AchButton />
        <AuthButton />
        <HelpButton />
        <div className="font-head hidden items-center gap-2 text-[8px] uppercase text-[var(--text-2)] 2xl:flex">
          <StatusDot />
          <span>One mind / {CLAIMABLE_COUNT} nodes</span>
        </div>
        <button
          type="button"
          aria-label="Menu"
          className="flex h-11 w-11 flex-col items-center justify-center gap-1 rounded-sm border-2 border-[var(--border)] md:hidden"
        >
          <span className="h-[2px] w-4 bg-[var(--text-2)]" />
          <span className="h-[2px] w-4 bg-[var(--text-2)]" />
          <span className="h-[2px] w-4 bg-[var(--text-2)]" />
        </button>
      </div>
    </header>
  );
}
