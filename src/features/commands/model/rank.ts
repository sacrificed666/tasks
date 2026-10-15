import { fuzzyScore } from "@/shared/lib/text";

export interface Rankable<Group extends string> {
  group: Group;
  label: string;
  keywords?: string;
}

// Matching commands per group, the best matches and groups first
export const rankCommands = <Group extends string, Item extends Rankable<Group>>(
  items: readonly Item[],
  query: string,
  order: readonly Group[],
): Array<{ group: Group; items: Item[] }> => {
  const scored = items.flatMap((item, index) => {
    const score = fuzzyScore(query, `${item.label} ${item.keywords ?? ""}`);
    return score === null ? [] : [{ item, score, index }];
  });

  return order
    .map((group) => {
      const entries = scored
        .filter((entry) => entry.item.group === group)
        .toSorted((a, b) => b.score - a.score || a.index - b.index);
      return { group, entries, best: entries[0]?.score ?? Number.NEGATIVE_INFINITY };
    })
    .filter(({ entries }) => entries.length > 0)
    .toSorted((a, b) => (query.trim() === "" ? 0 : b.best - a.best))
    .map(({ group, entries }) => ({ group, items: entries.map(({ item }) => item) }));
};
