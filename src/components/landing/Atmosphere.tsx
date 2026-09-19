// Purely decorative, fixed ambient backdrop: a soft glow behind the brain
// and a faint film-grain texture so panels don't read as flat black boxes.
export default function Atmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div
        className="absolute left-1/2 top-0 h-[70vh] w-[90vw] -translate-x-1/2 opacity-70"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 0%, var(--tod-glow) 0%, color-mix(in srgb, var(--tod-glow) 50%, transparent) 35%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 160px 40px rgba(0,0,0,0.55)",
        }}
      />
    </div>
  );
}
