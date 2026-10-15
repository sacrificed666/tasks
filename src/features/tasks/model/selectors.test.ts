import { describe, expect, it } from "vitest";

import { setupStore } from "@/app/store";
import { selectCurrentProject, selectList } from "@/features/lists/model/selectors";
import { sortChanged } from "@/features/lists/model/viewSlice";
import { makeProject, makeState, makeTask, sampleTasks } from "@/test/factories";

import {
  selectAllTags,
  selectCompletedIds,
  selectListCounts,
  selectListProgress,
  selectProjectCounts,
  selectTagCounts,
  selectVisibleTasks,
} from "./selectors";

const today = "2026-10-01";

const plannedTasks = [
  makeTask({ id: "late", title: "Late invoice", dueDate: "2026-09-29", important: true }),
  makeTask({ id: "now", title: "Daily standup", dueDate: today }),
  makeTask({ id: "soon", title: "Dentist", dueDate: "2026-10-06" }),
  makeTask({ id: "free", title: "Read a book" }),
  makeTask({ id: "done", title: "Old chore", completed: true, completedAt: 1 }),
];

// The state of a store made from tasks, a list and projects
const stateWith = (...args: Parameters<typeof makeState>) => setupStore(makeState(...args)).getState();

describe("selectors", () => {
  it("counts tasks for every list", () => {
    expect(selectListCounts(stateWith(plannedTasks), today)).toEqual({
      all: 4,
      today: 2,
      upcoming: 1,
      important: 1,
      completed: 1,
      overdue: 1,
      total: 5,
    });
  });

  it("lists completed ids in order", () => {
    expect(selectCompletedIds(stateWith(sampleTasks))).toEqual(["report"]);
  });

  it("splits visible tasks into sections", () => {
    const { active, completed } = selectVisibleTasks(stateWith(sampleTasks), today);
    expect(active.map((task) => task.id)).toEqual(["milk", "call"]);
    expect(completed.map((task) => task.id)).toEqual(["report"]);
  });

  it("applies smart lists", () => {
    expect(selectVisibleTasks(stateWith(plannedTasks, "today"), today).active.map((task) => task.id)).toEqual([
      "late",
      "now",
    ]);
    expect(selectVisibleTasks(stateWith(plannedTasks, "important"), today).active.map((task) => task.id)).toEqual([
      "late",
    ]);
    expect(selectVisibleTasks(stateWith(plannedTasks, "completed"), today)).toMatchObject({ active: [] });
  });

  it("applies the search query", () => {
    const { active, completed } = selectVisibleTasks(stateWith(sampleTasks, "all", "  MILK "), today);
    expect(active.map((task) => task.id)).toEqual(["milk"]);
    expect(completed).toEqual([]);
  });

  it("applies the sort mode", () => {
    const store = setupStore(makeState(plannedTasks));
    store.dispatch(sortChanged("alphabetical"));
    expect(selectVisibleTasks(store.getState(), today).active.map((task) => task.id)).toEqual([
      "now",
      "soon",
      "late",
      "free",
    ]);
  });

  it("reports progress for the current list", () => {
    expect(selectListProgress(stateWith(plannedTasks), today)).toEqual({ done: 1, total: 5 });
    expect(selectListProgress(stateWith(plannedTasks, "upcoming"), today)).toEqual({ done: 0, total: 1 });
  });

  it("memoizes results for unchanged input", () => {
    const state = stateWith(sampleTasks);
    expect(selectVisibleTasks(state, today)).toBe(selectVisibleTasks(state, today));
  });

  it("searches titles, notes and subtasks", () => {
    const tasks = [
      makeTask({ id: "trip", title: "Trip", notes: "Book the hotel" }),
      makeTask({ id: "move", title: "Move", subtasks: [{ id: "s", title: "Hire a van", completed: false }] }),
      ...sampleTasks,
    ];
    expect(selectVisibleTasks(stateWith(tasks, "all", "HOTEL"), today).active.map((task) => task.id)).toEqual(["trip"]);
    expect(selectVisibleTasks(stateWith(tasks, "all", "van"), today).active.map((task) => task.id)).toEqual(["move"]);
  });
});

describe("selectTagCounts", () => {
  it("counts tags of active tasks, case-insensitively and once per task", () => {
    const state = stateWith([
      makeTask({ id: "a", title: "Slides", tags: ["#Work", "#work"] }),
      makeTask({ id: "b", title: "Report", tags: ["#work", "#q4"] }),
      makeTask({ id: "c", title: "Done", tags: ["#home"], completed: true, completedAt: 1 }),
      makeTask({ id: "d", title: "Plan", tags: ["#q4"] }),
      makeTask({ id: "e", title: "No tags" }),
    ]);

    expect(selectTagCounts(state)).toEqual([
      { tag: "#q4", count: 2 },
      { tag: "#Work", count: 2 },
    ]);
    expect(selectAllTags(state)).toEqual(["#q4", "#Work", "#home"]);
  });
});

describe("projects and search", () => {
  const work = makeProject({ id: "work", name: "Work" });
  const tasks = [
    makeTask({ id: "a", title: "Slides", projectId: "work" }),
    makeTask({ id: "b", title: "Report", projectId: "work", completed: true, completedAt: 1 }),
    makeTask({ id: "c", title: "Slides for home", dueDate: today }),
  ];

  it("shows the tasks of the open project", () => {
    const visible = selectVisibleTasks(stateWith(tasks, "project:work", "", [work]), today);
    expect(visible.active.map((task) => task.id)).toEqual(["a"]);
    expect(visible.completed.map((task) => task.id)).toEqual(["b"]);
    expect(selectListProgress(stateWith(tasks, "project:work", "", [work]), today)).toEqual({ done: 1, total: 2 });
  });

  it("searches every list while a query is typed", () => {
    const visible = selectVisibleTasks(stateWith(tasks, "today", "slides", [work]), today);
    expect(visible.active.map((task) => task.id)).toEqual(["a", "c"]);
  });

  it("counts active tasks per project", () => {
    expect([...selectProjectCounts(stateWith(tasks, "all", "", [work]))]).toEqual([["work", 1]]);
  });

  it("falls back to all tasks when the open project is gone", () => {
    const state = stateWith(tasks, "project:gone", "", [work]);
    expect(selectList(state)).toBe("all");
    expect(selectCurrentProject(state)).toBeUndefined();
    expect(selectCurrentProject(stateWith(tasks, "project:work", "", [work]))).toEqual(work);
  });
});
