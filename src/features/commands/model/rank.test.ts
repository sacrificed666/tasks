import { describe, expect, it } from "vitest";

import { rankCommands } from "./rank";

type Group = "lists" | "sort" | "tasks";

const ORDER: readonly Group[] = ["lists", "sort", "tasks"];

const items = [
  { id: "today", group: "lists", label: "Go to Today" },
  { id: "all", group: "lists", label: "Go to All tasks", keywords: "inbox" },
  { id: "due", group: "sort", label: "Sort by: Due date" },
  { id: "title", group: "sort", label: "Sort by: Title A-Z" },
  { id: "task", group: "tasks", label: "Buy a sorting box" },
] satisfies Array<{ id: string; group: Group; label: string; keywords?: string }>;

// The ids of the items in their ranked groups
const ids = (groups: ReturnType<typeof rankCommands<Group, (typeof items)[number]>>) =>
  groups.map(({ group, items: entries }) => [group, entries.map((item) => item.id)]);

describe("rankCommands", () => {
  it("keeps every item in the default group order for an empty query", () => {
    expect(ids(rankCommands(items, "", ORDER))).toEqual([
      ["lists", ["today", "all"]],
      ["sort", ["due", "title"]],
      ["tasks", ["task"]],
    ]);
  });

  it("drops items and groups that do not match", () => {
    expect(ids(rankCommands(items, "today", ORDER))).toEqual([["lists", ["today"]]]);
    expect(rankCommands(items, "zzz", ORDER)).toEqual([]);
  });

  it("orders groups by their best match and items by score", () => {
    expect(ids(rankCommands(items, "sort", ORDER))).toEqual([
      ["sort", ["due", "title"]],
      ["tasks", ["task"]],
    ]);
    expect(ids(rankCommands(items, "title", ORDER))).toEqual([["sort", ["title"]]]);
  });
});
