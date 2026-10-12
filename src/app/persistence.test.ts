import { describe, expect, it, vi } from "vitest";

import { serializeData } from "@/features/data/model/document";
import { listChanged, sortChanged } from "@/features/lists/model/viewSlice";
import { toastDismissed, toastShown } from "@/features/notifications/model/toastSlice";
import { projectAdded } from "@/features/projects/model/projectsSlice";
import { selectProjects } from "@/features/projects/model/selectors";
import {
  accentChanged,
  appearanceChanged,
  backdropChanged,
  glassChanged,
  localeChanged,
} from "@/features/settings/model/settingsSlice";
import { selectTasks } from "@/features/tasks/model/selectors";
import { parseTasks } from "@/features/tasks/model/task";
import { taskAdded } from "@/features/tasks/model/tasksSlice";
import { readJson } from "@/shared/lib/storage";
import { makeProject, makeTask, sampleTasks } from "@/test/factories";

import { loadPersistedState, startPersistence, STORAGE_KEYS } from "./persistence";
import { setupStore } from "./store";

// The titles of the tasks in localStorage
const storedTitles = () => (parseTasks(readJson(localStorage, STORAGE_KEYS.data)) ?? []).map((task) => task.title);

const work = makeProject({ id: "work", name: "Work" });

// Makes the browser refuse every write, as a full storage does
const refuseWrites = () =>
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
  });

// The stored document for a list of tasks
const serializeTasks = (tasks: Parameters<typeof serializeData>[0]["tasks"]) => serializeData({ tasks, projects: [] });

describe("loadPersistedState", () => {
  it("reads saved tasks, projects and preferences", () => {
    localStorage.setItem(STORAGE_KEYS.data, serializeData({ tasks: sampleTasks, projects: [work] }));
    localStorage.setItem(
      STORAGE_KEYS.preferences,
      JSON.stringify({
        list: "project:work",
        sort: "dueDate",
        showCompleted: false,
        appearance: "light",
        accent: "forest",
        backdrop: "ocean",
        glass: "tinted",
      }),
    );

    const store = setupStore(loadPersistedState());

    expect(selectTasks(store.getState())).toEqual(sampleTasks);
    expect(selectProjects(store.getState())).toEqual([work]);
    expect(store.getState().view).toEqual({
      list: "project:work",
      query: "",
      sort: "dueDate",
      showCompleted: false,
      detailsId: null,
      overlay: null,
    });
    expect(store.getState().settings).toEqual({
      appearance: "light",
      accent: "forest",
      backdrop: "ocean",
      glass: "tinted",
      locale: "en",
      effects: "auto",
    });
  });

  it("opens all tasks when the saved project no longer exists", () => {
    localStorage.setItem(STORAGE_KEYS.data, serializeTasks(sampleTasks));
    localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ list: "project:gone" }));
    expect(setupStore(loadPersistedState()).getState().view.list).toBe("all");
  });

  it("detects the language on the first launch and keeps the saved one afterwards", () => {
    expect(loadPersistedState(localStorage, ["uk-UA", "en"])?.settings?.locale).toBe("uk");
    expect(loadPersistedState(localStorage, ["de-DE"])?.settings?.locale).toBe("de");
    expect(loadPersistedState(localStorage, ["ja-JP", "fr-CA"])?.settings?.locale).toBe("fr");
    expect(loadPersistedState(localStorage, ["pt-BR"])?.settings?.locale).toBe("pt");
    expect(loadPersistedState(localStorage, ["ja-JP"])?.settings?.locale).toBe("en");

    localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ locale: "en" }));
    expect(loadPersistedState(localStorage, ["uk-UA"])?.settings?.locale).toBe("en");
  });

  it("falls back to defaults for corrupted data", () => {
    localStorage.setItem(STORAGE_KEYS.data, "{broken");
    localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ list: "everything", sort: 1, accent: "magenta" }));

    const state = setupStore(loadPersistedState()).getState();

    expect(selectTasks(state)).toEqual([]);
    expect(state.view).toMatchObject({ list: "all", sort: "manual", showCompleted: true });
    expect(state.settings).toEqual({
      appearance: "system",
      accent: "blue",
      backdrop: "aurora",
      glass: "clear",
      locale: "en",
      effects: "auto",
    });
  });

  it("skips persistence when storage is unavailable", () => {
    expect(loadPersistedState(null)).toBeUndefined();
    expect(() => startPersistence(setupStore(), null)()).not.toThrow();
  });
});

describe("startPersistence", () => {
  it("saves tasks and preferences", () => {
    const store = setupStore();
    const stop = startPersistence(store);

    store.dispatch(taskAdded({ title: "Persist me" }));
    store.dispatch(listChanged("important"));
    store.dispatch(sortChanged("newest"));
    store.dispatch(appearanceChanged("dark"));
    store.dispatch(accentChanged("violet"));
    store.dispatch(backdropChanged("nebula"));
    store.dispatch(glassChanged("tinted"));
    store.dispatch(localeChanged("uk"));
    store.dispatch(projectAdded({ name: "Work" }));

    expect(storedTitles()).toEqual(["Persist me"]);
    expect(readJson(localStorage, STORAGE_KEYS.data)).toMatchObject({ projects: [{ name: "Work" }] });
    expect(readJson(localStorage, STORAGE_KEYS.preferences)).toEqual({
      list: "important",
      sort: "newest",
      showCompleted: true,
      appearance: "dark",
      accent: "violet",
      backdrop: "nebula",
      glass: "tinted",
      locale: "uk",
      effects: "auto",
    });

    stop();
    store.dispatch(taskAdded({ title: "Not saved" }));
    expect(storedTitles()).toEqual(["Persist me"]);
  });

  it("asks the browser to keep the data after the first change that leaves some", async () => {
    const persist = vi.fn<() => Promise<boolean>>(async () => true);
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: { persisted: async () => false, persist },
    });
    const store = setupStore();
    const stop = startPersistence(store);

    store.dispatch(listChanged("important"));
    expect(persist).not.toHaveBeenCalled();

    store.dispatch(taskAdded({ title: "Keep me" }));
    store.dispatch(taskAdded({ title: "And me" }));
    await vi.waitFor(() => expect(persist).toHaveBeenCalledOnce());

    stop();
    Reflect.deleteProperty(navigator, "storage");
  });

  it("offers a backup once when saving fails and again after a recovery", () => {
    vi.useFakeTimers();
    const store = setupStore();
    const stop = startPersistence(store);

    const setItem = refuseWrites();
    store.dispatch(taskAdded({ title: "Lost" }));
    store.dispatch(toastShown({ message: { key: "toast.added", params: { title: "Lost" } }, tone: "success" }));
    vi.runAllTimers();
    const toast = store.getState().toast.current;
    expect(toast).toMatchObject({ message: { key: "toast.saveFailed" }, tone: "error", action: { type: "export" } });

    store.dispatch(toastDismissed(toast?.id ?? ""));
    store.dispatch(taskAdded({ title: "Lost as well" }));
    vi.runAllTimers();
    expect(store.getState().toast.current).toBeNull();

    setItem.mockRestore();
    store.dispatch(taskAdded({ title: "Saved" }));
    expect(storedTitles()).toContain("Saved");

    refuseWrites();
    store.dispatch(taskAdded({ title: "Lost again" }));
    vi.runAllTimers();
    expect(store.getState().toast.current?.message.key).toBe("toast.saveFailed");

    stop();
    vi.useRealTimers();
  });

  it("drops a pending warning when it stops", () => {
    vi.useFakeTimers();
    const store = setupStore();
    const stop = startPersistence(store);
    refuseWrites();
    store.dispatch(taskAdded({ title: "Lost" }));
    stop();
    vi.runAllTimers();
    expect(store.getState().toast.current).toBeNull();
    vi.useRealTimers();
  });

  it("syncs changes made in another tab", () => {
    const store = setupStore();
    const stop = startPersistence(store);
    const external = serializeTasks([makeTask({ id: "remote", title: "From another tab" })]);

    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEYS.data, newValue: external, storageArea: localStorage }),
    );
    expect(selectTasks(store.getState()).map((task) => task.id)).toEqual(["remote"]);

    window.dispatchEvent(new StorageEvent("storage", { key: null, newValue: null, storageArea: localStorage }));
    expect(selectTasks(store.getState())).toEqual([]);

    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEYS.preferences, newValue: "{}", storageArea: localStorage }),
    );
    expect(selectTasks(store.getState())).toEqual([]);

    stop();
  });
});
