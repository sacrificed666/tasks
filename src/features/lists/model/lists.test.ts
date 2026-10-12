import { describe, expect, it } from "vitest";

import { makeTask } from "@/test/factories";

import {
  isListId,
  isOverdue,
  isProjectView,
  isViewId,
  matchesList,
  matchesView,
  projectIdOf,
  projectView,
} from "./lists";

const today = "2026-10-01";
const completedToday = new Date(2026, 9, 1, 12).getTime();
const completedEarlier = new Date(2026, 8, 20, 12).getTime();

describe("matchesList", () => {
  const overdue = makeTask({ id: "a", title: "Overdue", dueDate: "2026-09-28" });
  const dueToday = makeTask({ id: "b", title: "Today", dueDate: today });
  const upcoming = makeTask({ id: "c", title: "Later", dueDate: "2026-10-09", important: true });
  const undated = makeTask({ id: "d", title: "Someday" });

  it("groups tasks by due date", () => {
    expect([overdue, dueToday, upcoming, undated].filter((task) => matchesList(task, "today", today))).toEqual([
      overdue,
      dueToday,
    ]);
    expect([overdue, dueToday, upcoming, undated].filter((task) => matchesList(task, "upcoming", today))).toEqual([
      upcoming,
    ]);
  });

  it("keeps only tasks completed today in the Today list", () => {
    const doneToday = { ...dueToday, completed: true, completedAt: completedToday };
    const doneEarlier = { ...overdue, completed: true, completedAt: completedEarlier };
    expect(matchesList(doneToday, "today", today)).toBe(true);
    expect(matchesList(doneEarlier, "today", today)).toBe(false);
  });

  it("matches important, completed and all tasks", () => {
    expect(matchesList(upcoming, "important", today)).toBe(true);
    expect(matchesList(undated, "important", today)).toBe(false);
    expect(matchesList({ ...undated, completed: true }, "completed", today)).toBe(true);
    expect(matchesList(undated, "all", today)).toBe(true);
  });

  it("detects overdue tasks", () => {
    expect(isOverdue(overdue, today)).toBe(true);
    expect(isOverdue(dueToday, today)).toBe(false);
    expect(isOverdue({ ...overdue, completed: true }, today)).toBe(false);
  });

  it("validates list ids", () => {
    expect(isListId("today")).toBe(true);
    expect(isListId("active")).toBe(false);
  });
});

describe("views", () => {
  it("recognises smart lists and project views", () => {
    expect(isViewId("today")).toBe(true);
    expect(isViewId("project:work")).toBe(true);
    expect(isViewId("project:")).toBe(false);
    expect(isViewId("project:bad id")).toBe(false);
    expect(isViewId("someday")).toBe(false);
    expect(projectIdOf(projectView("work"))).toBe("work");
    expect(projectIdOf("today")).toBeNull();
    expect(isProjectView("project:work")).toBe(true);
  });

  it("matches tasks to project views by their project", () => {
    const task = makeTask({ id: "a", title: "Slides", projectId: "work" });
    expect(matchesView(task, "project:work", "2026-10-01")).toBe(true);
    expect(matchesView(task, "project:home", "2026-10-01")).toBe(false);
    expect(matchesView(task, "all", "2026-10-01")).toBe(true);
  });
});
