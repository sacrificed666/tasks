import { describe, expect, it } from "vitest";

import { makeTask } from "@/test/factories";

import { isSortMode, sortTasks } from "./sort";

const tasks = [
  makeTask({ id: "b", title: "banana", dueDate: "2026-10-05", createdAt: 2 }),
  makeTask({ id: "c", title: "Cherry", important: true, createdAt: 3 }),
  makeTask({ id: "a", title: "apple 10", dueDate: "2026-10-02", createdAt: 1 }),
  makeTask({ id: "d", title: "apple 9", important: true, dueDate: "2026-10-02", createdAt: 4 }),
];

// The ids of tasks in their order
const ids = (list: readonly { id: string }[]) => list.map((task) => task.id);

describe("sortTasks", () => {
  it("keeps the manual order", () => {
    expect(sortTasks(tasks, "manual")).toBe(tasks);
  });

  it("sorts by due date with undated tasks last", () => {
    expect(ids(sortTasks(tasks, "dueDate"))).toEqual(["a", "d", "b", "c"]);
  });

  it("puts important tasks first and keeps the rest in order", () => {
    expect(ids(sortTasks(tasks, "priority"))).toEqual(["c", "d", "b", "a"]);
  });

  it("sorts by creation time", () => {
    expect(ids(sortTasks(tasks, "newest"))).toEqual(["d", "c", "b", "a"]);
  });

  it("sorts titles naturally and case-insensitively", () => {
    expect(ids(sortTasks(tasks, "alphabetical"))).toEqual(["d", "a", "b", "c"]);
  });

  it("validates sort modes", () => {
    expect(isSortMode("dueDate")).toBe(true);
    expect(isSortMode("random")).toBe(false);
  });
});
