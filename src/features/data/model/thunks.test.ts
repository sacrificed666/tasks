import { describe, expect, it, vi } from "vitest";

import { setupStore } from "@/app/store";
import { formatMessage } from "@/features/notifications/model/format";
import { selectToast } from "@/features/notifications/model/selectors";
import { selectProjects } from "@/features/projects/model/selectors";
import { selectTasks } from "@/features/tasks/model/selectors";
import { taskRenamed } from "@/features/tasks/model/tasksSlice";
import { removeTasks } from "@/features/tasks/model/thunks";
import { createTranslator } from "@/shared/i18n/translate";
import * as download from "@/shared/lib/download";
import { makeProject, makeState, makeTask, sampleTasks } from "@/test/factories";

import { exportData, importData, redo, undo } from "./thunks";

type Store = ReturnType<typeof setupStore>;

// The task titles in the store
const titles = (store: Store) => selectTasks(store.getState()).map((task) => task.title);

// The text of the current toast in a language
const toastText = (store: Store, locale: "en" | "uk" = "en") => {
  const toast = selectToast(store.getState());
  return toast ? formatMessage(createTranslator(locale), toast.message) : null;
};

const work = makeProject({ id: "work", name: "Work" });

describe("importData", () => {
  it("imports new tasks from an export file", () => {
    const store = setupStore(makeState(sampleTasks));
    const file = JSON.stringify({
      tasks: [makeTask({ id: "milk", title: "Buy milk" }), makeTask({ id: "new", title: "Imported", important: true })],
    });

    store.dispatch(importData(file));

    expect(titles(store)).toEqual(["Buy milk", "Write the quarterly report", "Call grandma", "Imported"]);
    expect(selectTasks(store.getState()).at(-1)?.important).toBe(true);
    expect(toastText(store)).toBe("Imported 1 task");
  });

  it("imports projects together with their tasks", () => {
    const store = setupStore(makeState(sampleTasks));
    const file = JSON.stringify({
      tasks: [makeTask({ id: "deck", title: "Slides", projectId: "work" })],
      projects: [work],
    });

    store.dispatch(importData(file));

    expect(selectProjects(store.getState())).toEqual([work]);
    expect(selectTasks(store.getState()).at(-1)?.projectId).toBe("work");
  });

  it("reports projects when they are the only new data", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(importData(JSON.stringify({ tasks: sampleTasks, projects: [work] })));
    expect(toastText(store)).toBe("Imported 1 project");
    expect(toastText(store, "uk")).toBe("Імпортовано 1 проєкт");
  });

  it("reports when nothing new was found", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(importData(JSON.stringify({ tasks: sampleTasks })));
    expect(toastText(store)).toBe("Nothing new to import");
  });

  it("rejects invalid files", () => {
    const store = setupStore();
    store.dispatch(importData("{not json"));
    expect(selectToast(store.getState())?.tone).toBe("error");
    expect(toastText(store)).toBe("This file is not a valid task export");
  });
});

describe("exportData", () => {
  it("downloads every task and project with metadata", () => {
    const downloadJson = vi.spyOn(download, "downloadJson").mockImplementation(() => {});
    const store = setupStore(makeState(sampleTasks, "all", "", [work]));

    store.dispatch(exportData());

    expect(downloadJson).toHaveBeenCalledWith(
      expect.stringMatching(/^tasks-\d{4}-\d{2}-\d{2}\.json$/),
      expect.objectContaining({ app: "tasks", tasks: sampleTasks, projects: [work] }),
    );
  });
});

describe("undo and redo", () => {
  it("steps through the history and describes each step", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(taskRenamed("milk", "Buy oat milk"));
    store.dispatch(removeTasks(["call"]));

    store.dispatch(undo());
    expect(titles(store)).toEqual(["Buy oat milk", "Write the quarterly report", "Call grandma"]);
    expect(toastText(store)).toBe("Undone: delete 1 task");

    store.dispatch(undo());
    expect(titles(store)).toEqual(["Buy milk", "Write the quarterly report", "Call grandma"]);
    expect(toastText(store, "uk")).toBe("Скасовано: перейменування «Buy milk»");

    store.dispatch(redo());
    expect(titles(store)).toEqual(["Buy oat milk", "Write the quarterly report", "Call grandma"]);
    expect(toastText(store)).toBe("Redone: rename “Buy milk”");
  });

  it("does nothing without history", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(undo());
    store.dispatch(redo());
    expect(titles(store)).toHaveLength(3);
    expect(selectToast(store.getState())).toBeNull();
  });
});
