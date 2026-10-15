import { dataReplaced, type DataSnapshot } from "@/features/data/model/actions";
import { parseData, serializeData } from "@/features/data/model/document";
import { isViewId, projectIdOf, type ViewId } from "@/features/lists/model/lists";
import { isSortMode } from "@/features/lists/model/sort";
import { initialViewState, type ViewPreferences } from "@/features/lists/model/viewSlice";
import { toastShown } from "@/features/notifications/model/toastSlice";
import { projectsAdapter } from "@/features/projects/model/projectsSlice";
import { selectProjects } from "@/features/projects/model/selectors";
import { readSettings, type Settings } from "@/features/settings/model/settings";
import { selectTasks } from "@/features/tasks/model/selectors";
import { tasksAdapter } from "@/features/tasks/model/tasksSlice";
import { isRecord } from "@/shared/lib/guards";
import { getStorage, readJson, requestPersistence, writeText } from "@/shared/lib/storage";

import type { AppStore, RootState } from "./store";

export const STORAGE_KEYS = {
  data: "tasks/data",
  preferences: "tasks/preferences",
} as const;

type Preferences = Settings & ViewPreferences;

const EMPTY_DATA: DataSnapshot = { tasks: [], projects: [] };

// Saved tasks and projects, empty when there are none
const loadData = (storage: Storage): DataSnapshot => {
  const stored = readJson(storage, STORAGE_KEYS.data);
  return stored === undefined ? EMPTY_DATA : (parseData(stored) ?? EMPTY_DATA);
};

// The saved list, unless its project no longer exists
const readListPreference = (preferences: Record<string, unknown>, data: DataSnapshot): ViewId => {
  if (isViewId(preferences.list)) {
    const projectId = projectIdOf(preferences.list);
    if (projectId === null || data.projects.some((project) => project.id === projectId)) return preferences.list;
  }
  return initialViewState.list;
};

// Saved settings, list, sort and completed toggle with defaults
const loadPreferences = (storage: Storage, languages: readonly string[], data: DataSnapshot): Preferences => {
  const stored = readJson(storage, STORAGE_KEYS.preferences);
  const preferences = isRecord(stored) ? stored : {};

  return {
    ...readSettings(preferences, languages),
    list: readListPreference(preferences, data),
    sort: isSortMode(preferences.sort) ? preferences.sort : initialViewState.sort,
    showCompleted:
      typeof preferences.showCompleted === "boolean" ? preferences.showCompleted : initialViewState.showCompleted,
  };
};

// The part of the state that is stored as preferences
const selectPreferences = (state: RootState): Preferences => ({
  list: state.view.list,
  sort: state.view.sort,
  showCompleted: state.view.showCompleted,
  ...state.settings,
});

// The initial state from local storage
export const loadPersistedState = (
  storage: Storage | null = getStorage(),
  languages: readonly string[] = globalThis.navigator.languages,
): Partial<RootState> | undefined => {
  if (!storage) return undefined;

  const data = loadData(storage);
  const { list, sort, showCompleted, ...settings } = loadPreferences(storage, languages, data);

  return {
    tasks: tasksAdapter.setAll(tasksAdapter.getInitialState(), data.tasks),
    projects: projectsAdapter.setAll(projectsAdapter.getInitialState(), data.projects),
    view: { ...initialViewState, list, sort, showCompleted },
    settings,
  };
};

// Tasks and projects from stored text, empty when it is broken
const parseStoredData = (value: string | null): DataSnapshot => {
  if (value === null) return EMPTY_DATA;
  try {
    return parseData(JSON.parse(value) as unknown) ?? EMPTY_DATA;
  } catch {
    return EMPTY_DATA;
  }
};

// Saves every change and follows changes made in other tabs
export const startPersistence = (store: AppStore, storage: Storage | null = getStorage()): (() => void) => {
  if (!storage) return () => {};

  let { tasks, projects } = store.getState();
  let preferences = JSON.stringify(selectPreferences(store.getState()));
  let persistenceRequested = false;
  let saving = true;
  let warning: ReturnType<typeof setTimeout> | undefined;

  const unsubscribe = store.subscribe(() => {
    const state = store.getState();

    if (state.tasks !== tasks || state.projects !== projects) {
      ({ tasks, projects } = state);
      const saved = writeText(
        storage,
        STORAGE_KEYS.data,
        serializeData({ tasks: selectTasks(state), projects: selectProjects(state) }),
      );

      // A failed save offers a backup once, after the toast of the action
      if (saving && !saved) {
        warning = setTimeout(() => {
          store.dispatch(
            toastShown({ message: { key: "toast.saveFailed" }, tone: "error", action: { type: "export" } }),
          );
        });
      }
      saving = saved;

      // The first change that leaves data asks the browser to keep it
      if (!persistenceRequested && tasks.ids.length + projects.ids.length > 0) {
        persistenceRequested = true;
        void requestPersistence();
      }
    }

    const nextPreferences = JSON.stringify(selectPreferences(state));
    if (nextPreferences !== preferences) {
      preferences = nextPreferences;
      writeText(storage, STORAGE_KEYS.preferences, preferences);
    }
  });

  // Another tab changed the data, so take over its version
  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== storage) return;
    if (event.key !== null && event.key !== STORAGE_KEYS.data) return;
    store.dispatch(dataReplaced(parseStoredData(event.newValue)));
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    unsubscribe();
    clearTimeout(warning);
    window.removeEventListener("storage", handleStorage);
  };
};
