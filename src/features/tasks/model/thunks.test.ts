import { describe, expect, it } from "vitest";

import { setupStore } from "@/app/store";
import { undo } from "@/features/data/model/thunks";
import { queryChanged } from "@/features/lists/model/viewSlice";
import { formatMessage } from "@/features/notifications/model/format";
import { selectToast } from "@/features/notifications/model/selectors";
import { createTranslator } from "@/shared/i18n/translate";
import { dayFromToday, makeProject, makeState, makeTask, sampleTasks, todayKey } from "@/test/factories";

import { selectTasks } from "./selectors";
import {
  addTask,
  clearCompleted,
  dropTask,
  duplicateTask,
  homeListOf,
  homeViewOf,
  rescheduleOverdue,
  removeTasks,
  toggleTask,
  undoRemoval,
} from "./thunks";

type Store = ReturnType<typeof setupStore>;

// The task titles in the store
const titles = (store: Store) => selectTasks(store.getState()).map((task) => task.title);

// The text of the current toast in a language
const toastText = (store: Store, locale: "en" | "uk" = "en") => {
  const toast = selectToast(store.getState());
  return toast ? formatMessage(createTranslator(locale), toast.message) : null;
};

describe("addTask", () => {
  it("adds normalized tasks and reports success", () => {
    const store = setupStore();
    expect(store.dispatch(addTask({ title: "  Plan   the trip ", important: true }))).toBe(true);
    expect(selectTasks(store.getState())[0]).toMatchObject({ title: "Plan the trip", important: true });
  });

  it("rejects blank titles", () => {
    const store = setupStore();
    expect(store.dispatch(addTask({ title: "   " }))).toBe(false);
    expect(titles(store)).toEqual([]);
  });

  it("stays in the list and offers to show a task added elsewhere", () => {
    const store = setupStore(makeState(sampleTasks, "today", "report"));
    store.dispatch(addTask({ title: "Buy flowers", dueDate: dayFromToday(3) }));

    expect(store.getState().view).toMatchObject({ list: "today", query: "" });
    expect(selectToast(store.getState())).toMatchObject({
      message: { key: "toast.addedTo", params: { title: "Buy flowers", list: { key: "lists.upcoming" } } },
      action: { type: "show", list: "upcoming" },
    });
    expect(toastText(store)).toBe("Added “Buy flowers” to Upcoming");
  });

  it("picks the list a new task belongs to", () => {
    const today = todayKey();
    expect(homeListOf(makeTask({ id: "a", title: "a", dueDate: today }), today)).toBe("today");
    expect(homeListOf(makeTask({ id: "b", title: "b", dueDate: dayFromToday(-2) }), today)).toBe("today");
    expect(homeListOf(makeTask({ id: "c", title: "c", dueDate: dayFromToday(2) }), today)).toBe("upcoming");
    expect(homeListOf(makeTask({ id: "d", title: "d", important: true }), today)).toBe("important");
    expect(homeListOf(makeTask({ id: "e", title: "e" }), today)).toBe("all");
  });

  it("names the project a task was added to", () => {
    const store = setupStore(makeState([], "today", "", [makeProject({ id: "work", name: "💼 Work" })]));
    store.dispatch(addTask({ title: "Slides", projectId: "work" }));

    expect(selectToast(store.getState())).toMatchObject({
      message: { params: { list: "💼 Work" } },
      action: { type: "show", list: "project:work" },
    });
    expect(toastText(store)).toBe("Added “Slides” to 💼 Work");
  });

  it("prefers the project over a smart list as the home of a task", () => {
    const today = todayKey();
    expect(homeViewOf(makeTask({ id: "a", title: "a", dueDate: today, projectId: "work" }), today)).toBe(
      "project:work",
    );
    expect(homeViewOf(makeTask({ id: "b", title: "b", important: true }), today)).toBe("important");
  });

  it("stays in the current list when the new task belongs there", () => {
    const store = setupStore(makeState([], "upcoming"));
    store.dispatch(queryChanged("flow"));
    store.dispatch(addTask({ title: "Buy flowers", dueDate: dayFromToday(2) }));
    expect(store.getState().view).toMatchObject({ list: "upcoming", query: "flow" });
  });
});

describe("removal and undo", () => {
  it("removes tasks and offers to undo", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(removeTasks(["call", "milk"]));

    expect(titles(store)).toEqual(["Write the quarterly report"]);
    expect(selectToast(store.getState())).toMatchObject({
      message: { key: "toast.deletedMany", params: { count: 2 } },
      tone: "neutral",
      action: { type: "restore" },
    });
    expect(toastText(store)).toBe("Deleted 2 tasks");
    expect(toastText(store, "uk")).toBe("Видалено 2 завдання");

    store.dispatch(undoRemoval());
    expect(titles(store)).toEqual(["Buy milk", "Write the quarterly report", "Call grandma"]);
    expect(selectToast(store.getState())).toBeNull();
  });

  it("names a single deleted task", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(removeTasks(["milk"]));
    expect(toastText(store)).toBe("Deleted “Buy milk”");
    expect(toastText(store, "uk")).toBe("Видалено «Buy milk»");
  });

  it("ignores unknown ids", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(removeTasks(["missing"]));
    expect(selectToast(store.getState())).toBeNull();
    store.dispatch(undoRemoval());
    expect(titles(store)).toHaveLength(3);
  });

  it("clears completed tasks", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(clearCompleted());
    expect(titles(store)).toEqual(["Buy milk", "Call grandma"]);
    expect(toastText(store)).toBe("Cleared 1 completed task");
  });
});

describe("toggleTask", () => {
  it("celebrates when the last active task of a list is completed", () => {
    const today = todayKey();
    const store = setupStore(
      makeState(
        [
          makeTask({ id: "a", title: "First", dueDate: today }),
          makeTask({ id: "b", title: "Second", dueDate: today }),
          makeTask({ id: "c", title: "Later" }),
        ],
        "today",
      ),
    );

    expect(store.dispatch(toggleTask("a", today))).toBe(false);
    expect(selectToast(store.getState())).toBeNull();

    expect(store.dispatch(toggleTask("b", today))).toBe(true);
    expect(selectToast(store.getState())?.tone).toBe("success");
    expect(toastText(store)).toBe("Everything in Today is done!");
    expect(toastText(store, "uk")).toBe("У списку «Сьогодні» усе виконано!");
  });

  it("does not celebrate reopening or the completed list", () => {
    const today = todayKey();
    const store = setupStore(makeState(sampleTasks, "completed"));
    expect(store.dispatch(toggleTask("report", today))).toBe(false);
    expect(store.dispatch(toggleTask("report", today))).toBe(false);
    expect(selectToast(store.getState())).toBeNull();
  });
});

describe("duplicateTask", () => {
  it("inserts an active copy after the original", () => {
    const store = setupStore(makeState(sampleTasks));
    const copyId = store.dispatch(duplicateTask("report"));

    const tasks = selectTasks(store.getState());
    expect(tasks.map((task) => task.title)).toEqual([
      "Buy milk",
      "Write the quarterly report",
      "Write the quarterly report",
      "Call grandma",
    ]);
    expect(tasks[2]).toMatchObject({ id: copyId, completed: false, completedAt: null });
    expect(toastText(store)).toBe("Duplicated “Write the quarterly report”");
  });

  it("ignores unknown ids", () => {
    const store = setupStore(makeState(sampleTasks));
    expect(store.dispatch(duplicateTask("missing"))).toBeNull();
    expect(titles(store)).toHaveLength(3);
  });
});

describe("rescheduleOverdue", () => {
  it("moves every overdue task to today in one undoable step", () => {
    const today = todayKey();
    const store = setupStore(
      makeState([
        makeTask({ id: "late", title: "Late", dueDate: dayFromToday(-3) }),
        makeTask({ id: "later", title: "Later", dueDate: dayFromToday(-1) }),
        makeTask({ id: "done", title: "Done", dueDate: dayFromToday(-1), completed: true, completedAt: 1 }),
        makeTask({ id: "future", title: "Future", dueDate: dayFromToday(2) }),
      ]),
    );

    expect(store.dispatch(rescheduleOverdue(today))).toBe(2);
    expect(selectTasks(store.getState()).map((task) => task.dueDate)).toEqual([
      today,
      today,
      dayFromToday(-1),
      dayFromToday(2),
    ]);
    expect(toastText(store)).toBe("Moved 2 tasks to today");
    expect(selectToast(store.getState())?.action).toEqual({ type: "undo" });

    store.dispatch(undo());
    expect(selectTasks(store.getState())[0]?.dueDate).toBe(dayFromToday(-3));
    expect(store.dispatch(rescheduleOverdue(dayFromToday(-10)))).toBe(0);
  });
});

describe("dropTask", () => {
  it("applies the meaning of the list a task was dropped on", () => {
    const today = todayKey();
    const store = setupStore(
      makeState(
        [makeTask({ id: "a", title: "Slides" }), makeTask({ id: "b", title: "Later", dueDate: dayFromToday(5) })],
        "all",
        "",
        [makeProject({ id: "work", name: "Work" })],
      ),
    );
    // A task in the store by its id
    const task = (id: string) => selectTasks(store.getState()).find((entry) => entry.id === id);

    expect(store.dispatch(dropTask("a", "today", today))).toBe(true);
    expect(task("a")?.dueDate).toBe(today);
    expect(toastText(store)).toBe("Moved “Slides” to Today");

    store.dispatch(dropTask("a", "upcoming", today));
    expect(task("a")?.dueDate).toBe(dayFromToday(1));
    expect(store.dispatch(dropTask("b", "upcoming", today))).toBe(false);

    store.dispatch(dropTask("a", "important", today));
    expect(task("a")?.important).toBe(true);
    expect(store.dispatch(dropTask("a", "important", today))).toBe(false);

    store.dispatch(dropTask("a", "project:work", today));
    expect(task("a")?.projectId).toBe("work");
    expect(toastText(store)).toBe("Moved “Slides” to Work");

    store.dispatch(dropTask("a", "completed", today));
    expect(task("a")?.completed).toBe(true);
    expect(selectToast(store.getState())?.action).toEqual({ type: "undo" });
    expect(store.dispatch(dropTask("missing", "today", today))).toBe(false);
  });
});
