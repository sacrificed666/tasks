// Collapses whitespace and caps the length in characters, not code units
export const normalizeLine = (value: string, maxLength: number) =>
  Array.from(value.replaceAll(/\s+/gu, " ").trim()).slice(0, maxLength).join("").trim();

// Lower case without accents for searching
export const normalizeForSearch = (value: string) =>
  value
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .trim();

// Whether a position starts a word
const isWordStart = (text: string, index: number) => index === 0 || /[\s\-_/#«“"(]/u.test(text[index - 1] ?? "");

// How well a query matches text, or null; whole words score higher
export const fuzzyScore = (query: string, target: string): number | null => {
  const needle = normalizeForSearch(query);
  if (needle === "") return 0;
  const haystack = normalizeForSearch(target);

  const index = haystack.indexOf(needle);
  if (index !== -1) return 1000 + (isWordStart(haystack, index) ? 200 : 0) - index - haystack.length / 100;

  let score = 0;
  let position = -1;
  let streak = 0;
  for (const char of needle) {
    if (char === " ") continue;
    const next = haystack.indexOf(char, position + 1);
    if (next === -1) return null;
    const gap = next - position - 1;
    if (position !== -1 && gap > 3 && !isWordStart(haystack, next)) return null;
    streak = gap === 0 ? streak + 1 : 0;
    score += 10 + streak * 6 + (isWordStart(haystack, next) ? 12 : 0) - Math.min(gap, 8);
    position = next;
  }
  return score;
};
