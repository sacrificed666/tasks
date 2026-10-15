import { describe, expect, it } from "vitest";

import { MAX_SUBTASKS, parseSubtasks, subtaskProgress } from "./subtasks";

describe("parseSubtasks", () => {
  it("keeps valid subtasks, normalizes titles and repairs identifiers", () => {
    const parsed = parseSubtasks([
      { id: "a", title: "  Pack   the bag ", completed: true },
      { id: "a", title: "Duplicate id" },
      { title: "   " },
      { id: "bad id!", title: "Bad id" },
      "text",
    ]);
    expect(parsed.map(({ title, completed }) => ({ title, completed }))).toEqual([
      { title: "Pack the bag", completed: true },
      { title: "Duplicate id", completed: false },
      { title: "Bad id", completed: false },
    ]);
    expect(new Set(parsed.map((subtask) => subtask.id)).size).toBe(3);
    expect(parsed[0]?.id).toBe("a");
  });

  it("caps the number of subtasks", () => {
    const list = Array.from({ length: MAX_SUBTASKS + 5 }, (_, index) => ({ title: `Step ${index}` }));
    expect(parseSubtasks(list)).toHaveLength(MAX_SUBTASKS);
  });
});

describe("subtaskProgress", () => {
  it("counts completed subtasks", () => {
    expect(
      subtaskProgress([
        { id: "a", title: "A", completed: true },
        { id: "b", title: "B", completed: false },
      ]),
    ).toEqual({ done: 1, total: 2 });
    expect(subtaskProgress([])).toEqual({ done: 0, total: 0 });
  });
});
