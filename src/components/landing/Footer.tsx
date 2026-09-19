import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 flex shrink-0 flex-col gap-2 border-t border-[var(--divider)] px-5 py-2.5 font-head text-[8px] uppercase text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
      <span>SYNNOD — 128 VOICES. ONE MIND.</span>
      <div className="flex gap-4">
        <a href="#nodes" className="hover:text-[var(--text-2)]">
          Nodes
        </a>
        <a href="#memory" className="hover:text-[var(--text-2)]">
          Memory
        </a>
        <a href="#mind" className="hover:text-[var(--text-2)]">
          The mind
        </a>
        <Link href="/docs" className="text-[var(--lime)] hover:text-[var(--text)]">
          Docs
        </Link>
      </div>
    </footer>
  );
}
