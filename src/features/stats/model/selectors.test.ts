import { describe, expect, it } from "vitest";

import { setupStore } from "@/app/store";
import { makeProject, makeState, makeTask } from "@/test/factories";

import { selectActivity, selectProjectProgress } from "./selectors";

const today = "2026-10-01";
// The state of a store made from tasks, a list and projects
const stateWith = (...args: Parameters<typeof makeState>) => setupStore(makeState(...args)).getState();

// Noon of a day as a timestamp
const noonOf = (day: string) => new Date(`${day}T12:00:00`).getTime();
// A task completed on a day
const doneOn = (id: string, day: string) => makeTask({ id, title: id, completed: true, completedAt: noonOf(day) });

describe("selectActivity", () => {
  it("counts completions for the last seven days", () => {
    const state = stateWith([
      doneOn("a", "2026-10-01"),
      doneOn("b", "2026-10-01"),
      doneOn("c", "2026-09-29"),
      doneOn("d", "2026-09-20"),
      makeTask({ id: "open", title: "Open" }),
    ]);

    const { days } = selectActivity(state, today);

    expect(days.map((entry) => entry.day)).toEqual([
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
    ]);
    expect(days.map((entry) => entry.count)).toEqual([0, 0, 0, 0, 1, 0, 2]);
  });

  it("counts the streak of consecutive days up to today or yesterday", () => {
    expect(selectActivity(stateWith([doneOn("a", "2026-10-01"), doneOn("b", "2026-09-30")]), today).streak).toBe(2);
    expect(selectActivity(stateWith([doneOn("a", "2026-09-30"), doneOn("b", "2026-09-29")]), today).streak).toBe(2);
    expect(selectActivity(stateWith([doneOn("a", "2026-09-29")]), today).streak).toBe(0);
    expect(selectActivity(stateWith([]), today).streak).toBe(0);
  });
});

describe("selectProjectProgress", () => {
  it("counts done and total tasks per project in sidebar order", () => {
    const state = setupStore(
      makeState(
        [
          makeTask({ id: "a", title: "A", projectId: "home" }),
          makeTask({ id: "b", title: "B", projectId: "home", completed: true, completedAt: 1 }),
          makeTask({ id: "c", title: "C", projectId: "work" }),
          makeTask({ id: "d", title: "D" }),
        ],
        "all",
        "",
        [
          makeProject({ id: "work", name: "Work" }),
          makeProject({ id: "empty", name: "Empty" }),
          makeProject({ id: "home", name: "Home" }),
        ],
      ),
    ).getState();

    expect(selectProjectProgress(state).map(({ project, done, total }) => [project.id, done, total])).toEqual([
      ["work", 0, 1],
      ["home", 1, 2],
    ]);
  });
});
