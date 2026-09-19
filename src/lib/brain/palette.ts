export type Color = [number, number, number];

export interface Family {
  ft: Color; // face top
  fb: Color; // face bottom
  rim: Color; // bright rim
  rim2: Color; // dim rim
  st: Color; // top bevel
  sl: Color; // side (shadow)
  sp: Color; // star/sparkle pixel
  crack: Color; // crack line
}

export type FamilyName = "navy" | "violet" | "ice" | "blue" | "lav" | "pink";

export const FAM: Record<FamilyName, Family> = {
  navy: {
    ft: [30, 40, 104],
    fb: [14, 19, 58],
    rim: [84, 128, 228],
    rim2: [40, 58, 130],
    st: [40, 54, 124],
    sl: [10, 13, 40],
    sp: [130, 180, 255],
    crack: [70, 150, 230],
  },
  violet: {
    ft: [60, 36, 126],
    fb: [30, 18, 78],
    rim: [188, 108, 238],
    rim2: [96, 52, 160],
    st: [78, 48, 150],
    sl: [22, 12, 54],
    sp: [210, 170, 255],
    crack: [170, 110, 240],
  },
  ice: {
    ft: [186, 236, 255],
    fb: [112, 188, 250],
    rim: [230, 248, 255],
    rim2: [150, 210, 255],
    st: [90, 150, 220],
    sl: [40, 70, 150],
    sp: [255, 255, 255],
    crack: [255, 255, 255],
  },
  blue: {
    ft: [100, 150, 248],
    fb: [58, 98, 220],
    rim: [160, 206, 255],
    rim2: [96, 140, 240],
    st: [60, 90, 190],
    sl: [26, 40, 110],
    sp: [230, 242, 255],
    crack: [200, 230, 255],
  },
  lav: {
    ft: [156, 116, 244],
    fb: [118, 80, 222],
    rim: [214, 176, 255],
    rim2: [150, 110, 240],
    st: [96, 66, 180],
    sl: [44, 28, 100],
    sp: [245, 235, 255],
    crack: [230, 210, 255],
  },
  pink: {
    ft: [236, 128, 224],
    fb: [196, 88, 200],
    rim: [255, 186, 246],
    rim2: [220, 120, 220],
    st: [140, 60, 160],
    sl: [70, 24, 90],
    sp: [255, 235, 252],
    crack: [255, 220, 250],
  },
};

export const NODE_PALETTE = {
  rim: [214, 250, 120] as Color,
  inner: [120, 170, 90] as Color,
  faceTop: [60, 110, 90] as Color,
  faceBottom: [40, 80, 70] as Color,
};

export const GHOST_COLOR: Color = [26, 26, 66];
export const HAZE_COLOR: [number, number, number, number] = [60, 34, 130, 45];

export function mix(a: Color, b: Color, t: number): Color {
  const k = Math.max(0, Math.min(1, t));
  return [a[0] * (1 - k) + b[0] * k, a[1] * (1 - k) + b[1] * k, a[2] * (1 - k) + b[2] * k];
}

export function dim(c: Color, f: number): Color {
  return [
    Math.max(0, Math.min(255, Math.round(c[0] * f))),
    Math.max(0, Math.min(255, Math.round(c[1] * f))),
    Math.max(0, Math.min(255, Math.round(c[2] * f))),
  ];
}
