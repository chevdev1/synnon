import type { IconKey } from "@/lib/achievements";

// 8x8 pixel bitmaps. # = tier colour, o = light tint of it, x = dark.
const BITMAPS: Record<IconKey, string[]> = {
  hex: ["..####..", ".#oooo#.", "#oo##oo#", "#o#xx#o#", "#o#xx#o#", "#oo##oo#", ".#oooo#.", "..####.."],
  eye: ["........", "..####..", ".#oooo#.", "#ooxxoo#", "#ooxxoo#", ".#oooo#.", "..####..", "........"],
  wallet: ["........", ".######.", "#oooooo#", "#ooooo##", "#oooo#x#", "#ooooo##", "#oooooo#", ".######."],
  star: ["...##...", "...##...", "##oooo##", ".#oooo#.", "..#oo#..", ".#o##o#.", ".##..##.", "........"],
  bolt: ["...####.", "..#oo#..", ".#oo#...", ".#oooo#.", "..#oo#..", "..#o#...", ".#o#....", ".##....."],
  moon: ["..####..", ".#ooo#..", "#ooo#...", "#ooo#...", "#ooo#...", "#oooo#..", ".#oooo#.", "..####.."],
  sun: ["#..##..#", ".#oooo#.", ".#oooo#.", "##oooo##", "##oooo##", ".#oooo#.", ".#oooo#.", "#..##..#"],
  compass: ["...##...", "..#oo#..", ".#oooo#.", "#ooxxoo#", "#ooxxoo#", ".#oooo#.", "..#oo#..", "...##..."],
  clock: ["..####..", ".#oooo#.", "#ooxooo#", "#ooxooo#", "#ooxxoo#", "#oooooo#", ".#oooo#.", "..####.."],
  book: [".#####..", "#ooooo#.", "#o###o#.", "#ooooo#.", "#o###o#.", "#ooooo#.", ".#####..", "........"],
  brain: ["..##.##.", ".#oo#oo#", "#oooooo#", "#ooxooo#", "#oooxoo#", ".#oooo#.", "..#oo#..", "...##..."],
  ghost: ["..####..", ".#oooo#.", "#oxooxo#", "#oooooo#", "#oooooo#", "#oooooo#", "#o#oo#o#", ".#.##.#."],
  tv: [".#....#.", "..#..#..", ".######.", "#oooooo#", "#oxxxxo#", "#oxxxxo#", "#oooooo#", ".######."],
  trophy: ["#.####.#", "#oooooo#", ".#oooo#.", "..#oo#..", "...##...", "...##...", "..####..", "..####.."],
};

const mix = (hex: string, to: number, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

export default function AchIcon({ icon, color, size = 32, locked = false }: { icon: IconKey; color: string; size?: number; locked?: boolean }) {
  const rows = BITMAPS[icon];
  const pal = locked
    ? { "#": "#3a4180", o: "#262c5e", x: "#1a1f47" }
    : { "#": color, o: mix(color, 255, 0.55), x: mix(color, 0, 0.55) };
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" shapeRendering="crispEdges" aria-hidden className="shrink-0">
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={pal[ch as "#" | "o" | "x"]} />))
      )}
    </svg>
  );
}
