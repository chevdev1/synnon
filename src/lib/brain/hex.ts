const S3 = Math.sqrt(3);

export function key(x: number, y: number): string {
  return x + "," + y;
}

export function parseKey(k: string): [number, number] {
  const i = k.indexOf(",");
  return [Number(k.slice(0, i)), Number(k.slice(i + 1))];
}

// Pixel mask of a pointy-ish hex face with chamfered tips, ported 1:1 from
// brain_reference_generator.py's hexmask().
export function hexMask(cx: number, cy: number, R: number): Set<string> {
  const m = new Set<string>();
  const yMin = Math.trunc(cy - R - 2);
  const yMax = Math.trunc(cy + R + 3);
  const xMin = Math.trunc(cx - R - 2);
  const xMax = Math.trunc(cx + R + 3);
  for (let y = yMin; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      const dx = Math.abs(x + 0.5 - cx);
      const dy = Math.abs(y + 0.5 - cy);
      if (dx <= (R * S3) / 2 && dy <= R - dx / S3 && !(dy > R * 0.86 && dx > R * 0.18)) {
        m.add(key(x, y));
      }
    }
  }
  return m;
}

export function isEdge(m: Set<string>, x: number, y: number): boolean {
  return !(
    m.has(key(x - 1, y)) &&
    m.has(key(x + 1, y)) &&
    m.has(key(x, y - 1)) &&
    m.has(key(x, y + 1))
  );
}
