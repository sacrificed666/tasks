import { describe, expect, it } from "vitest";

import { dataImported, dataReplaced } from "@/features/data/model/actions";
import { projectRemoved } from "@/features/projects/model/projectsSlice";
import { makeTask } from "@/test/factories";

import {
  allTasksMarked,
  subtaskAdded,
  subtaskMoved,
  subtaskRemoved,
  subtaskRenamed,
  subtaskToggled,
  taskAdded,
  taskDuplicated,
  taskMoved,
  taskNoted,
  taskProjectChanged,
  taskRepeatChanged,
  taskImportanceToggled,
  taskRenamed,
  taskScheduled,
  tasksAdapter,
  tasksRemoved,
  tasksRestored,
  tasksScheduled,
  tasksSlice,
  taskToggled,
} from "./tasksSlice";

const reducer = tasksSlice.reducer;

// A state with tasks of these ids
const stateOf = (...ids: string[]) =>
  tasksAdapter.setAll(
    tasksAdapter.getInitialState(),
    ids.map((id) => makeTask({ id, title: `Task ${id}` })),
  );

describe("tasksSlice", () => {
  it("prepends new tasks with normalized titles", () => {
    const state = reducer(
      stateOf("a"),
      taskAdded({ title: "  Fresh   task ", important: true, dueDate: "2026-10-02" }),
    );
    const [id] = state.ids;

    expect(state.ids).toHaveLength(2);
    expect(id === undefined ? undefined : state.entities[id]).toMatchObject({
      title: "Fresh task",
      important: true,
      dueDate: "2026-10-02",
    });
  });

  it("ignores blank titles", () => {
    expect(reducer(stateOf("a"), taskAdded({ title: "   " })).ids).toEqual(["a"]);
  });

  it("toggles completion and tracks timestamps", () => {
    const completed = reducer(stateOf("a"), { type: taskToggled.type, payload: { id: "a", at: 10 } });
    expect(completed.entities.a).toMatchObject({ completed: true, completedAt: 10, updatedAt: 10 });

    const reopened = reducer(completed, { type: taskToggled.type, payload: { id: "a", at: 20 } });
    expect(reopened.entities.a).toMatchObject({ completed: false, completedAt: null, updatedAt: 20 });
  });

  it("renames tasks and skips empty or unchanged titles", () => {
    const renamed = reducer(stateOf("a"), taskRenamed("a", "  New   name "));
    expect(renamed.entities.a?.title).toBe("New name");
    expect(reducer(renamed, taskRenamed("a", "   "))).toBe(renamed);
    expect(reducer(renamed, taskRenamed("a", "New name"))).toBe(renamed);
    expect(reducer(renamed, taskRenamed("missing", "Title"))).toBe(renamed);
  });

  it("toggles importance", () => {
    const starred = reducer(stateOf("a"), taskImportanceToggled("a"));
    expect(starred.entities.a?.important).toBe(true);
    expect(reducer(starred, taskImportanceToggled("a")).entities.a?.important).toBe(false);
  });

  it("schedules and unschedules tasks", () => {
    const scheduled = reducer(stateOf("a"), taskScheduled("a", "2026-10-05"));
    expect(scheduled.entities.a?.dueDate).toBe("2026-10-05");
    expect(reducer(scheduled, taskScheduled("a", "not a date")).entities.a?.dueDate).toBeNull();
    expect(reducer(scheduled, taskScheduled("a", "2026-10-05"))).toBe(scheduled);
  });

  it("moves tasks in both directions", () => {
    const state = stateOf("a", "b", "c", "d");
    expect(reducer(state, taskMoved({ activeId: "a", overId: "c" })).ids).toEqual(["b", "c", "a", "d"]);
    expect(reducer(state, taskMoved({ activeId: "d", overId: "b" })).ids).toEqual(["a", "d", "b", "c"]);
    expect(reducer(state, taskMoved({ activeId: "a", overId: "missing" }))).toBe(state);
  });

  it("marks every task as completed or active", () => {
    const completed = reducer(stateOf("a", "b"), allTasksMarked(true));
    expect(Object.values(completed.entities).every((task) => task.completed)).toBe(true);

    const active = reducer(completed, allTasksMarked(false));
    expect(Object.values(active.entities).every((task) => !task.completed && task.completedAt === null)).toBe(true);
  });

  it("restores removed tasks at their original positions", () => {
    const state = stateOf("a", "b", "c", "d");
    const removed = [
      { task: state.entities.d!, index: 3 },
      { task: state.entities.b!, index: 1 },
    ];
    const pruned = reducer(state, tasksRemoved(["b", "d"]));
    expect(pruned.ids).toEqual(["a", "c"]);

    const restored = reducer(pruned, tasksRestored(removed));
    expect(restored.ids).toEqual(["a", "b", "c", "d"]);
    expect(reducer(restored, tasksRestored(removed))).toBe(restored);
  });

  it("imports only unknown tasks and appends them", () => {
    const state = reducer(
      stateOf("a"),
      dataImported({
        tasks: [makeTask({ id: "a", title: "Duplicate" }), makeTask({ id: "z", title: "Imported" })],
        projects: [],
      }),
    );

    expect(state.ids).toEqual(["a", "z"]);
    expect(state.entities.a?.title).toBe("Task a");
  });

  it("replaces the whole collection", () => {
    const state = reducer(
      stateOf("a", "b"),
      dataReplaced({ tasks: [makeTask({ id: "x", title: "Only" })], projects: [] }),
    );
    expect(state.ids).toEqual(["x"]);
  });

  it("moves tasks between projects", () => {
    const state = reducer(stateOf("a"), taskProjectChanged("a", "work"));
    expect(state.entities.a?.projectId).toBe("work");
    expect(reducer(state, taskProjectChanged("a", "work"))).toBe(state);
    expect(reducer(state, taskProjectChanged("a", null)).entities.a?.projectId).toBeNull();
  });

  it("deletes the tasks of a deleted project", () => {
    const state = tasksAdapter.setAll(tasksAdapter.getInitialState(), [
      makeTask({ id: "a", title: "A", projectId: "work" }),
      makeTask({ id: "b", title: "B" }),
      makeTask({ id: "c", title: "C", projectId: "work", completed: true }),
    ]);
    expect(reducer(state, projectRemoved("work")).ids).toEqual(["b"]);
  });

  it("updates notes only when they change", () => {
    const state = reducer(stateOf("a"), taskNoted("a", "Pack the bag  \r\n"));
    expect(state.entities.a).toMatchObject({ notes: "Pack the bag" });

    const unchanged = reducer(state, taskNoted("a", "Pack the bag"));
    expect(unchanged).toBe(state);
    expect(reducer(state, taskNoted("missing", "x"))).toBe(state);
  });

  it("duplicates a task right after the original as an active copy", () => {
    const completed = reducer(stateOf("a", "b"), taskToggled("a"));
    const state = reducer(completed, taskDuplicated("a"));
    const copyId = state.ids[1] ?? "";

    expect(state.ids).toHaveLength(3);
    expect(state.ids[2]).toBe("b");
    expect(state.entities[copyId]).toMatchObject({ title: "Task a", completed: false, completedAt: null });
    expect(reducer(state, taskDuplicated("missing"))).toBe(state);
  });

  it("creates the next occurrence when a repeating task is completed", () => {
    const at = new Date(2026, 9, 1, 12).getTime();
    const repeating = tasksAdapter.setAll(tasksAdapter.getInitialState(), [
      makeTask({ id: "a", title: "Water plants", dueDate: "2026-09-29", repeat: "daily" }),
      makeTask({ id: "b", title: "Other" }),
    ]);

    const state = reducer(repeating, { type: taskToggled.type, payload: { id: "a", at, nextId: "next" } });

    expect(state.ids).toEqual(["a", "next", "b"]);
    expect(state.entities.a).toMatchObject({ completed: true, repeat: null });
    expect(state.entities.next).toMatchObject({
      title: "Water plants",
      completed: false,
      completedAt: null,
      dueDate: "2026-10-02",
      repeat: "daily",
    });

    const reopened = reducer(state, taskToggled("a"));
    expect(reopened.ids).toHaveLength(3);
  });

  it("starts the next occurrence with every subtask open again", () => {
    const at = new Date(2026, 9, 1, 12).getTime();
    const repeating = tasksAdapter.setAll(tasksAdapter.getInitialState(), [
      makeTask({
        id: "a",
        title: "Morning routine",
        dueDate: "2026-10-01",
        repeat: "daily",
        subtasks: [{ id: "s", title: "Stretch", completed: true }],
      }),
    ]);
    const state = reducer(repeating, { type: taskToggled.type, payload: { id: "a", at, nextId: "next" } });
    expect(state.entities.a?.subtasks).toEqual([{ id: "s", title: "Stretch", completed: true }]);
    expect(state.entities.next?.subtasks).toEqual([{ id: "s", title: "Stretch", completed: false }]);
  });

  it("keeps monthly repeats on the day the series started", () => {
    const at = new Date(2026, 1, 28, 12).getTime();
    const rent = tasksAdapter.setAll(tasksAdapter.getInitialState(), [
      makeTask({ id: "a", title: "Rent", dueDate: "2026-02-28", repeat: "monthly", repeatAnchor: "2026-01-31" }),
    ]);

    const state = reducer(rent, { type: taskToggled.type, payload: { id: "a", at, nextId: "next" } });

    expect(state.entities.next).toMatchObject({ dueDate: "2026-03-31", repeatAnchor: "2026-01-31" });
    expect(state.entities.a).toMatchObject({ repeat: null, repeatAnchor: null });
  });

  it("moves the anchor when a repeating task is rescheduled by hand", () => {
    const state = reducer(
      tasksAdapter.setAll(tasksAdapter.getInitialState(), [
        makeTask({ id: "a", title: "Gym", dueDate: "2026-10-01", repeat: "weekly", repeatAnchor: "2026-10-01" }),
      ]),
      taskScheduled("a", "2026-10-03"),
    );
    expect(state.entities.a).toMatchObject({ dueDate: "2026-10-03", repeatAnchor: "2026-10-03" });
  });

  it("changes repeats and gives undated tasks a start date", () => {
    const state = reducer(stateOf("a"), taskRepeatChanged("a", "weekly"));
    expect(state.entities.a?.repeat).toBe("weekly");
    expect(state.entities.a?.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(reducer(state, taskRepeatChanged("a", "weekly"))).toBe(state);

    expect(state.entities.a?.repeatAnchor).toBe(state.entities.a?.dueDate);

    const undated = reducer(state, taskScheduled("a", null));
    expect(undated.entities.a).toMatchObject({ dueDate: null, repeat: null, repeatAnchor: null });
  });

  it("reschedules several tasks at once", () => {
    const state = reducer(stateOf("a", "b", "c"), tasksScheduled(["a", "c", "missing"], "2026-10-05"));
    expect([state.entities.a?.dueDate, state.entities.b?.dueDate, state.entities.c?.dueDate]).toEqual([
      "2026-10-05",
      null,
      "2026-10-05",
    ]);
    expect(reducer(state, tasksScheduled(["a"], "not a date"))).toBe(state);
  });
});

// A trip with two subtasks
const withSteps = () =>
  tasksAdapter.setAll(tasksAdapter.getInitialState(), [
    makeTask({
      id: "trip",
      title: "Trip",
      subtasks: [
        { id: "s1", title: "Passport", completed: false },
        { id: "s2", title: "Tickets", completed: false },
        { id: "s3", title: "Charger", completed: false },
      ],
    }),
  ]);

describe("subtasks", () => {
  it("adds a subtask with a normalized title and ignores empty ones", () => {
    const state = reducer(withSteps(), subtaskAdded("trip", "  Snacks  "));
    expect(state.entities.trip?.subtasks.at(-1)).toMatchObject({ title: "Snacks", completed: false });
    expect(reducer(state, subtaskAdded("trip", "   "))).toBe(state);
    expect(reducer(state, subtaskAdded("missing", "Snacks"))).toBe(state);
  });

  it("stops at the subtask limit", () => {
    let state = withSteps();
    for (let index = 0; index < 60; index += 1) state = reducer(state, subtaskAdded("trip", `Step ${index}`));
    expect(state.entities.trip?.subtasks).toHaveLength(50);
  });

  it("toggles, renames and removes one subtask", () => {
    let state = reducer(withSteps(), subtaskToggled("trip", "s2"));
    expect(state.entities.trip?.subtasks[1]?.completed).toBe(true);
    state = reducer(state, subtaskRenamed("trip", "s1", " Passports "));
    expect(state.entities.trip?.subtasks[0]?.title).toBe("Passports");
    expect(reducer(state, subtaskRenamed("trip", "s1", "  "))).toBe(state);
    state = reducer(state, subtaskRemoved("trip", "s3"));
    expect(state.entities.trip?.subtasks.map((subtask) => subtask.id)).toEqual(["s1", "s2"]);
    expect(reducer(state, subtaskRemoved("trip", "missing"))).toBe(state);
  });

  it("moves a subtask to another position", () => {
    const state = reducer(withSteps(), subtaskMoved("trip", "s3", 0));
    expect(state.entities.trip?.subtasks.map((subtask) => subtask.id)).toEqual(["s3", "s1", "s2"]);
    expect(reducer(state, subtaskMoved("trip", "s3", 5))).toBe(state);
  });
});
