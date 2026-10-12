import { createAction, createSlice, type EntityState, type Reducer, type UnknownAction } from "@reduxjs/toolkit";

import type { ToastMessage } from "@/features/notifications/model/toastSlice";
import type { Project } from "@/features/projects/model/project";
import { projectAdded, projectMoved, projectRemoved, projectUpdated } from "@/features/projects/model/projectsSlice";
import type { Task } from "@/features/tasks/model/task";
import {
  allTasksMarked,
  subtaskAdded,
  subtaskMoved,
  subtaskRemoved,
  subtaskRenamed,
  subtaskToggled,
  taskAdded,
  taskDuplicated,
  taskImportanceToggled,
  taskMoved,
  taskNoted,
  taskProjectChanged,
  taskRenamed,
  taskRepeatChanged,
  taskScheduled,
  tasksScheduled,
  taskTagsChanged,
  tasksRemoved,
  tasksRestored,
  taskToggled,
} from "@/features/tasks/model/tasksSlice";
import { isRecord } from "@/shared/lib/guards";

import { dataImported, dataReplaced } from "./actions";

export const HISTORY_LIMIT = 50;

type TasksState = EntityState<Task, string>;
type ProjectsState = EntityState<Project, string>;

export interface Snapshot {
  tasks: TasksState;
  projects: ProjectsState;
}

export interface HistoryEntry extends Snapshot {
  description: ToastMessage;
}

export interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

const initialState: HistoryState = { past: [], future: [] };

// Undo and redo stacks, filled by withHistory
export const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {},
});

export const undone = createAction("history/undone");
export const redone = createAction("history/redone");

// A history message that names a task
const titled = (key: ToastMessage["key"], task: Task | undefined): ToastMessage => ({
  key,
  params: { title: task?.title ?? "" },
});

// A history message that names a subtask
const subtaskNamed = (key: ToastMessage["key"], task: Task | undefined, subtaskId: string): ToastMessage => ({
  key,
  params: { title: task?.subtasks.find((subtask) => subtask.id === subtaskId)?.title ?? "" },
});

// A history message that names a project
const named = (key: ToastMessage["key"], project: Project | undefined): ToastMessage => ({
  key,
  params: { name: project?.name ?? "" },
});

// What an action changed, for the undo and redo toasts
export const describeChange = (action: UnknownAction, { tasks, projects }: Snapshot): ToastMessage => {
  if (taskAdded.match(action)) return titled("history.added", action.payload);
  if (taskDuplicated.match(action)) return titled("history.duplicated", tasks.entities[action.payload.id]);
  if (taskToggled.match(action)) {
    const task = tasks.entities[action.payload.id];
    return titled(task?.completed ? "history.reopened" : "history.completed", task);
  }
  if (taskRenamed.match(action)) return titled("history.renamed", tasks.entities[action.payload.id]);
  if (taskImportanceToggled.match(action)) {
    const task = tasks.entities[action.payload.id];
    return titled(task?.important ? "history.unstarred" : "history.starred", task);
  }
  if (taskScheduled.match(action)) return titled("history.scheduled", tasks.entities[action.payload.id]);
  if (tasksScheduled.match(action)) return { key: "history.rescheduled", params: { count: action.payload.ids.length } };
  if (taskRepeatChanged.match(action)) return titled("history.repeat", tasks.entities[action.payload.id]);
  if (taskProjectChanged.match(action)) return titled("history.projectChanged", tasks.entities[action.payload.id]);
  if (taskNoted.match(action)) return titled("history.noted", tasks.entities[action.payload.id]);
  if (taskTagsChanged.match(action)) return titled("history.tagged", tasks.entities[action.payload.id]);
  if (subtaskAdded.match(action))
    return { key: "history.subtaskAdded", params: { title: action.payload.subtask.title } };
  if (subtaskToggled.match(action)) {
    const task = tasks.entities[action.payload.taskId];
    const done = task?.subtasks.find((subtask) => subtask.id === action.payload.subtaskId)?.completed;
    return subtaskNamed(done ? "history.subtaskReopened" : "history.subtaskCompleted", task, action.payload.subtaskId);
  }
  if (subtaskRenamed.match(action)) {
    return subtaskNamed("history.subtaskRenamed", tasks.entities[action.payload.taskId], action.payload.subtaskId);
  }
  if (subtaskRemoved.match(action)) {
    return subtaskNamed("history.subtaskRemoved", tasks.entities[action.payload.taskId], action.payload.subtaskId);
  }
  if (subtaskMoved.match(action)) return { key: "history.subtasksReordered" };
  if (taskMoved.match(action)) return { key: "history.moved" };
  if (allTasksMarked.match(action)) return { key: "history.markedAll" };
  if (tasksRemoved.match(action)) return { key: "history.removed", params: { count: action.payload.length } };
  if (tasksRestored.match(action)) return { key: "history.restored" };
  if (dataImported.match(action)) return { key: "history.imported" };
  if (projectAdded.match(action)) return named("history.projectAdded", action.payload);
  if (projectUpdated.match(action)) return named("history.projectEdited", projects.entities[action.payload.id]);
  if (projectMoved.match(action)) return { key: "history.projectsReordered" };
  if (projectRemoved.match(action)) return named("history.projectRemoved", projects.entities[action.payload]);
  return { key: "history.changed" };
};

interface UndoableState extends Snapshot {
  history: HistoryState;
}

// Whether a state carries tasks, projects and history
const isUndoable = (value: unknown): value is UndoableState =>
  isRecord(value) && "tasks" in value && "projects" in value && "history" in value;

// Moves one snapshot between the undo and redo stacks
const step = <State extends UndoableState>(state: State, direction: "back" | "forward"): State => {
  const source = direction === "back" ? state.history.past : state.history.future;
  const entry = source.at(-1);
  if (!entry) return state;

  const moved = { tasks: state.tasks, projects: state.projects, description: entry.description };
  return {
    ...state,
    tasks: entry.tasks,
    projects: entry.projects,
    history:
      direction === "back"
        ? { past: state.history.past.slice(0, -1), future: [...state.history.future, moved] }
        : { past: [...state.history.past, moved], future: state.history.future.slice(0, -1) },
  };
};

// Wraps the root reducer so every data change can be undone
export const withHistory =
  <State extends UndoableState, Preloaded>(
    reducer: Reducer<State, UnknownAction, Preloaded>,
  ): Reducer<State, UnknownAction, Preloaded> =>
  (state, action) => {
    const next = reducer(state, action);
    if (undone.match(action)) return step(next, "back");
    if (redone.match(action)) return step(next, "forward");
    if (!isUndoable(state) || (next.tasks === state.tasks && next.projects === state.projects)) return next;
    if (dataReplaced.match(action)) return { ...next, history: initialState };

    const entry = { tasks: state.tasks, projects: state.projects, description: describeChange(action, state) };
    return { ...next, history: { past: [...state.history.past, entry].slice(-HISTORY_LIMIT), future: [] } };
  };
