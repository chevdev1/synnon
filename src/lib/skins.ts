// Cell skins: a cosmetic style for your own cell that everybody sees on the brain.
// They are earned by speaking through the cell: the number of approved voices is counted on
// the server, so a skin can't be faked from the browser.
export interface Skin {
  id: string;
  name: { en: string; ru: string };
  color: string;
  needVoices: number;
  desc: { en: string; ru: string };
}

export const SKINS: Skin[] = [
  { id: "ice", name: { en: "Frost", ru: "Иней" }, color: "#9be3ff", needVoices: 0, desc: { en: "A frosty rim with glints of ice.", ru: "Морозный ободок с искрами льда." } },
  { id: "ember", name: { en: "Ember", ru: "Жар" }, color: "#ff8a4c", needVoices: 3, desc: { en: "A warm rim that flickers like coals.", ru: "Тёплый ободок, мерцающий как угли." } },
  { id: "aurora", name: { en: "Aurora", ru: "Сияние" }, color: "#7fffc4", needVoices: 10, desc: { en: "A rim that slowly shifts from green to pink.", ru: "Ободок, медленно меняющий цвет от зелёного к розовому." } },
  { id: "gold", name: { en: "Gilded", ru: "Позолота" }, color: "#ffd166", needVoices: 25, desc: { en: "A golden rim with twinkling stars.", ru: "Золотой ободок с мерцающими звёздами." } },
  { id: "void", name: { en: "Void", ru: "Пустота" }, color: "#b9a6f5", needVoices: 50, desc: { en: "A dark cell ringed with violet, dotted with stars.", ru: "Тёмная клетка в фиолетовом кольце, усыпанная звёздами." } },
];
export const SKIN_BY_ID = new Map(SKINS.map((s) => [s.id, s]));
export const isSkin = (s: unknown): s is string => typeof s === "string" && SKIN_BY_ID.has(s);
