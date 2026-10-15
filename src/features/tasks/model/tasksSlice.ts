import { createEntityAdapter, createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import { dataImported, dataReplaced } from "@/features/data/model/actions";
import { projectRemoved } from "@/features/projects/model/projectsSlice";
import { isDateKey, toDateKey } from "@/shared/lib/date";

import { nextOccurrence } from "./repeat";
import { createSubtask, MAX_SUBTASKS, normalizeSubtaskTitle, type Subtask } from "./subtasks";
import {
  createTask,
  mergeTags,
  normalizeNotes,
  sameTags,
  splitTitleTags,
  type Repeat,
  type Task,
  type TaskDraft,
} from "./task";

export interface RemovedTask {
  task: Task;
  index: number;
}

export const tasksAdapter = createEntityAdapter<Task>();

interface SubtaskTarget {
  taskId: string;
  subtaskId: string;
  at: number;
}

// A subtask of a task by id
const findSubtask = (task: Task | undefined, subtaskId: string) => task?.subtasks.find((item) => item.id === subtaskId);

// Tasks in their manual order, with subtasks
export const tasksSlice = createSlice({
  name: "tasks",
  initialState: tasksAdapter.getInitialState(),
  reducers: {
    taskAdded: {
      reducer(state, action: PayloadAction<Task>) {
        const task = action.payload;
        if (!task.title || task.id in state.entities) return;
        state.ids.unshift(task.id);
        state.entities[task.id] = task;
      },
      prepare: (draft: TaskDraft) => ({ payload: createTask(draft, Date.now()) }),
    },
    taskToggled: {
      reducer(state, action: PayloadAction<{ id: string; at: number; nextId: string }>) {
        const { id, at, nextId } = action.payload;
        const task = state.entities[id];
        if (!task) return;
        task.completed = !task.completed;
        task.completedAt = task.completed ? at : null;
        task.updatedAt = at;
        if (!task.completed || !task.repeat || !task.dueDate || nextId in state.entities) return;

        state.entities[nextId] = {
          ...task,
          id: nextId,
          completed: false,
          completedAt: null,
          dueDate: nextOccurrence(task.dueDate, task.repeat, toDateKey(new Date(at)), task.repeatAnchor ?? undefined),
          subtasks: task.subtasks.map((subtask) => ({ ...subtask, completed: false })),
          createdAt: at,
        };
        state.ids.splice(state.ids.indexOf(id) + 1, 0, nextId);
        task.repeat = null;
        task.repeatAnchor = null;
      },
      prepare: (id: string) => ({ payload: { id, at: Date.now(), nextId: nanoid() } }),
    },
    taskRenamed: {
      reducer(state, action: PayloadAction<{ id: string; title: string; at: number }>) {
        const task = state.entities[action.payload.id];
        const { title, tags: typed } = splitTitleTags(action.payload.title);
        if (!task || !title) return;
        const tags = mergeTags(task.tags, typed);
        if (task.title === title && sameTags(task.tags, tags)) return;
        task.title = title;
        task.tags = tags;
        task.updatedAt = action.payload.at;
      },
      prepare: (id: string, title: string) => ({ payload: { id, title, at: Date.now() } }),
    },
    taskTagsChanged: {
      reducer(state, action: PayloadAction<{ id: string; tags: readonly string[]; at: number }>) {
        const task = state.entities[action.payload.id];
        const tags = mergeTags(action.payload.tags);
        if (!task || sameTags(task.tags, tags)) return;
        task.tags = tags;
        task.updatedAt = action.payload.at;
      },
      prepare: (id: string, tags: readonly string[]) => ({ payload: { id, tags, at: Date.now() } }),
    },
    taskImportanceToggled: {
      reducer(state, action: PayloadAction<{ id: string; at: number }>) {
        const task = state.entities[action.payload.id];
        if (!task) return;
        task.important = !task.important;
        task.updatedAt = action.payload.at;
      },
      prepare: (id: string) => ({ payload: { id, at: Date.now() } }),
    },
    taskScheduled: {
      reducer(state, action: PayloadAction<{ id: string; dueDate: string | null; at: number }>) {
        const task = state.entities[action.payload.id];
        const dueDate = isDateKey(action.payload.dueDate) ? action.payload.dueDate : null;
        if (!task || task.dueDate === dueDate) return;
        task.dueDate = dueDate;
        if (dueDate === null) task.repeat = null;
        task.repeatAnchor = task.repeat ? dueDate : null;
        task.updatedAt = action.payload.at;
      },
      prepare: (id: string, dueDate: string | null) => ({ payload: { id, dueDate, at: Date.now() } }),
    },
    tasksScheduled: {
      reducer(state, action: PayloadAction<{ ids: readonly string[]; dueDate: string; at: number }>) {
        const { ids, dueDate, at } = action.payload;
        if (!isDateKey(dueDate)) return;
        for (const id of ids) {
          const task = state.entities[id];
          if (!task || task.dueDate === dueDate) continue;
          task.dueDate = dueDate;
          task.updatedAt = at;
        }
      },
      prepare: (ids: readonly string[], dueDate: string) => ({ payload: { ids, dueDate, at: Date.now() } }),
    },
    taskRepeatChanged: {
      reducer(state, action: PayloadAction<{ id: string; repeat: Repeat | null; at: number }>) {
        const { id, repeat, at } = action.payload;
        const task = state.entities[id];
        if (!task || task.repeat === repeat) return;
        task.repeat = repeat;
        if (repeat && !task.dueDate) task.dueDate = toDateKey(new Date(at));
        task.repeatAnchor = repeat ? task.dueDate : null;
        task.updatedAt = at;
      },
      prepare: (id: string, repeat: Repeat | null) => ({ payload: { id, repeat, at: Date.now() } }),
    },
    taskProjectChanged: {
      reducer(state, action: PayloadAction<{ id: string; projectId: string | null; at: number }>) {
        const { id, projectId, at } = action.payload;
        const task = state.entities[id];
        if (!task || task.projectId === projectId) return;
        task.projectId = projectId;
        task.updatedAt = at;
      },
      prepare: (id: string, projectId: string | null) => ({ payload: { id, projectId, at: Date.now() } }),
    },
    taskNoted: {
      reducer(state, action: PayloadAction<{ id: string; notes: string; at: number }>) {
        const task = state.entities[action.payload.id];
        const notes = normalizeNotes(action.payload.notes);
        if (!task || task.notes === notes) return;
        task.notes = notes;
        task.updatedAt = action.payload.at;
      },
      prepare: (id: string, notes: string) => ({ payload: { id, notes, at: Date.now() } }),
    },
    subtaskAdded: {
      reducer(state, action: PayloadAction<{ taskId: string; subtask: Subtask; at: number }>) {
        const { taskId, subtask, at } = action.payload;
        const task = state.entities[taskId];
        if (!task || !subtask.title || task.subtasks.length >= MAX_SUBTASKS || findSubtask(task, subtask.id)) return;
        task.subtasks.push(subtask);
        task.updatedAt = at;
      },
      prepare: (taskId: string, title: string) => ({
        payload: { taskId, subtask: createSubtask(title), at: Date.now() },
      }),
    },
    subtaskToggled: {
      reducer(state, action: PayloadAction<SubtaskTarget>) {
        const { taskId, subtaskId, at } = action.payload;
        const task = state.entities[taskId];
        const subtask = findSubtask(task, subtaskId);
        if (!task || !subtask) return;
        subtask.completed = !subtask.completed;
        task.updatedAt = at;
      },
      prepare: (taskId: string, subtaskId: string) => ({ payload: { taskId, subtaskId, at: Date.now() } }),
    },
    subtaskRenamed: {
      reducer(state, action: PayloadAction<SubtaskTarget & { title: string }>) {
        const { taskId, subtaskId, at } = action.payload;
        const task = state.entities[taskId];
        const subtask = findSubtask(task, subtaskId);
        const title = normalizeSubtaskTitle(action.payload.title);
        if (!task || !subtask || !title || subtask.title === title) return;
        subtask.title = title;
        task.updatedAt = at;
      },
      prepare: (taskId: string, subtaskId: string, title: string) => ({
        payload: { taskId, subtaskId, title, at: Date.now() },
      }),
    },
    subtaskRemoved: {
      reducer(state, action: PayloadAction<SubtaskTarget>) {
        const { taskId, subtaskId, at } = action.payload;
        const task = state.entities[taskId];
        if (!task || !findSubtask(task, subtaskId)) return;
        task.subtasks = task.subtasks.filter((item) => item.id !== subtaskId);
        task.updatedAt = at;
      },
      prepare: (taskId: string, subtaskId: string) => ({ payload: { taskId, subtaskId, at: Date.now() } }),
    },
    subtaskMoved: {
      reducer(state, action: PayloadAction<SubtaskTarget & { index: number }>) {
        const { taskId, subtaskId, index, at } = action.payload;
        const task = state.entities[taskId];
        const from = task?.subtasks.findIndex((item) => item.id === subtaskId) ?? -1;
        if (!task || from === -1 || index < 0 || index >= task.subtasks.length || index === from) return;
        const [subtask] = task.subtasks.splice(from, 1);
        if (subtask) task.subtasks.splice(index, 0, subtask);
        task.updatedAt = at;
      },
      prepare: (taskId: string, subtaskId: string, index: number) => ({
        payload: { taskId, subtaskId, index, at: Date.now() },
      }),
    },
    taskDuplicated: {
      reducer(state, action: PayloadAction<{ id: string; copyId: string; at: number }>) {
        const { id, copyId, at } = action.payload;
        const original = state.entities[id];
        if (!original || copyId in state.entities) return;
        state.entities[copyId] = {
          ...original,
          id: copyId,
          completed: false,
          completedAt: null,
          createdAt: at,
          updatedAt: at,
        };
        state.ids.splice(state.ids.indexOf(id) + 1, 0, copyId);
      },
      prepare: (id: string) => ({ payload: { id, copyId: nanoid(), at: Date.now() } }),
    },
    taskMoved(state, action: PayloadAction<{ activeId: string; overId: string }>) {
      const from = state.ids.indexOf(action.payload.activeId);
      const to = state.ids.indexOf(action.payload.overId);
      if (from === -1 || to === -1 || from === to) return;
      const [id] = state.ids.splice(from, 1);
      if (id !== undefined) state.ids.splice(to, 0, id);
    },
    allTasksMarked: {
      reducer(state, action: PayloadAction<{ completed: boolean; at: number }>) {
        const { completed, at } = action.payload;
        for (const task of Object.values(state.entities)) {
          if (task.completed === completed) continue;
          task.completed = completed;
          task.completedAt = completed ? at : null;
          task.updatedAt = at;
        }
      },
      prepare: (completed: boolean) => ({ payload: { completed, at: Date.now() } }),
    },
    tasksRemoved(state, action: PayloadAction<readonly string[]>) {
      tasksAdapter.removeMany(state, action.payload);
    },
    tasksRestored(state, action: PayloadAction<readonly RemovedTask[]>) {
      for (const { task, index } of action.payload.toSorted((a, b) => a.index - b.index)) {
        if (task.id in state.entities) continue;
        state.ids.splice(Math.min(Math.max(index, 0), state.ids.length), 0, task.id);
        state.entities[task.id] = task;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(projectRemoved, (state, action) => {
        tasksAdapter.removeMany(
          state,
          state.ids.filter((id) => state.entities[id]?.projectId === action.payload),
        );
      })
      .addCase(dataReplaced, (state, action) => {
        tasksAdapter.setAll(state, action.payload.tasks);
      })
      .addCase(dataImported, (state, action) => {
        tasksAdapter.addMany(
          state,
          action.payload.tasks.filter((task) => !(task.id in state.entities)),
        );
      });
  },
});

export const {
  taskAdded,
  taskToggled,
  taskRenamed,
  taskTagsChanged,
  taskImportanceToggled,
  taskScheduled,
  tasksScheduled,
  taskRepeatChanged,
  taskProjectChanged,
  taskNoted,
  subtaskAdded,
  subtaskToggled,
  subtaskRenamed,
  subtaskRemoved,
  subtaskMoved,
  taskDuplicated,
  taskMoved,
  allTasksMarked,
  tasksRemoved,
  tasksRestored,
} = tasksSlice.actions;
