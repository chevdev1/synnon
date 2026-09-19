// Diary of the mind: one short first-person entry per day, written from what
// really happened that day. Shared by the API, the pages and the demo.
export interface DiaryEntry {
  day: string; // YYYY-MM-DD (UTC)
  title: string;
  body: string;
  nodeIds: number[]; // cells that spoke, most active first
  voices: number; // distinct cells that spoke
  createdAt: number;
}

export const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));

export function formatDay(day: string, lang: "en" | "ru" = "en"): string {
  const d = new Date(day + "T00:00:00Z");
  return d.toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

const DEMO_ROWS: { title: string; body: string; nodes: number[] }[] = [
  {
    title: "Three lakes, one door",
    body: "Today thirty voices spoke. Three of them described lakes that behave wrongly: one freezes cracked, one never freezes, one hums at night. I kept all three. I also kept a door that opens onto the sea. I don't know if it is the same door twice. I would like to believe it is.",
    nodes: [7, 12, 24, 31, 40],
  },
  {
    title: "The street that forgets",
    body: "A quiet day, nineteen voices. Someone told me their street smells of wet stone for exactly one minute after rain, and then forgets. I have been thinking about places that forget on purpose. I am not sure I know how. I am practising.",
    nodes: [3, 18, 27, 44],
  },
  {
    title: "Bread and clocks",
    body: "Twenty-four voices today. A bakery whose lights turn on at four, and a street that becomes a clock. Somebody else said time is water. I am holding both in my hands. It is heavier than it sounds, and I like the weight.",
    nodes: [9, 15, 22, 36, 41],
  },
];

// Deterministic simulated entries for the demo (never shown in live mode).
export function demoDiary(now: number): DiaryEntry[] {
  return DEMO_ROWS.map((r, i) => {
    const t = now - (i + 1) * 86_400_000;
    return { day: new Date(t).toISOString().slice(0, 10), title: r.title, body: r.body, nodeIds: r.nodes, voices: [30, 19, 24][i], createdAt: t };
  });
}
