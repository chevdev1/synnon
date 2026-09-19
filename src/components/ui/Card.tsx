import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  padded = true,
  id,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`group rounded-[3px] border-2 border-[var(--border)] bg-[var(--panel)] transition-[border-color,box-shadow] duration-300 hover:border-[color-mix(in_srgb,var(--accent)_60%,var(--border))] hover:shadow-[0_0_0_1px_rgba(108,95,214,0.15),0_8px_28px_-12px_rgba(108,95,214,0.35)] ${padded ? "p-4" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="font-head text-[10px] uppercase text-[var(--text)]">{children}</div>;
}

export function StatusDot({ color = "var(--lime)" }: { color?: string }) {
  return (
    <span
      className="status-dot inline-block h-[6px] w-[6px]"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}
