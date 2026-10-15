import type { AppThunk, RootState } from "@/app/store";
import {
  isOverdue,
  isProjectView,
  matchesView,
  projectIdOf,
  projectView,
  type ListId,
  type ViewId,
} from "@/features/lists/model/lists";
import { selectDetailsId, selectList, selectQuery, selectSearching } from "@/features/lists/model/selectors";
import { detailsClosed, queryChanged } from "@/features/lists/model/viewSlice";
import { selectToast } from "@/features/notifications/model/selectors";
import { toastDismissed, toastShown, type ToastMessage } from "@/features/notifications/model/toastSlice";
import { addDays, toDateKey } from "@/shared/lib/date";

import { selectCompletedIds, selectTaskById, selectTasks } from "./selectors";
import { createMatcher, normalizeTitle, type Task, type TaskDraft } from "./task";
import {
  taskAdded,
  taskDuplicated,
  taskImportanceToggled,
  taskProjectChanged,
  taskScheduled,
  tasksRemoved,
  tasksRestored,
  tasksScheduled,
  taskToggled,
  type RemovedTask,
} from "./tasksSlice";

// Adds a task and offers to show it when it lands in another list
export const addTask =
  (draft: TaskDraft): AppThunk<boolean> =>
  (dispatch, getState) => {
    const title = normalizeTitle(draft.title);
    if (!title) return false;

    const { payload: task } = dispatch(taskAdded({ ...draft, title }));
    if (!createMatcher(selectQuery(getState()))(title)) dispatch(queryChanged(""));

    const state = getState();
    const today = toDateKey(new Date());
    if (selectSearching(state) || matchesView(task, selectList(state), today)) return true;

    const view = homeViewOf(task, today);
    dispatch(
      toastShown({
        message: { key: "toast.addedTo", params: { title: task.title, list: viewName(state, view) } },
        tone: "success",
        action: { type: "show", list: view, taskId: task.id },
      }),
    );
    return true;
  };

// The name of a list or project for a toast
const viewName = (state: RootState, view: ViewId): ToastMessage | string =>
  isProjectView(view) ? (state.projects.entities[projectIdOf(view) ?? ""]?.name ?? "") : { key: `lists.${view}` };

// The smart list a task belongs to
export const homeListOf = (task: Task, today: string): ListId => {
  if (task.dueDate !== null) return task.dueDate <= today ? "today" : "upcoming";
  return task.important ? "important" : "all";
};

// The project or smart list a task belongs to
export const homeViewOf = (task: Task, today: string): ViewId =>
  task.projectId === null ? homeListOf(task, today) : projectView(task.projectId);

// Moves every overdue task to today, with undo
export const rescheduleOverdue =
  (today: string): AppThunk<number> =>
  (dispatch, getState) => {
    const ids = selectTasks(getState())
      .filter((task) => isOverdue(task, today))
      .map((task) => task.id);
    if (ids.length === 0) return 0;

    dispatch(tasksScheduled(ids, today));
    dispatch(
      toastShown({
        message: { key: "toast.rescheduled", params: { count: ids.length } },
        action: { type: "undo" },
      }),
    );
    return ids.length;
  };

// Completes or reopens a task and says when the list is done
export const toggleTask =
  (id: string, today: string): AppThunk<boolean> =>
  (dispatch, getState) => {
    dispatch(taskToggled(id));

    const state = getState();
    const list = selectList(state);
    if (list === "completed" || selectSearching(state) || !selectTaskById(state, id)?.completed) return false;
    if (selectTasks(state).some((task) => !task.completed && matchesView(task, list, today))) return false;

    dispatch(
      toastShown({ message: { key: "toast.allDone", params: { list: viewName(state, list) } }, tone: "success" }),
    );
    return true;
  };

// Copies a task right below the original
export const duplicateTask =
  (id: string): AppThunk<string | null> =>
  (dispatch, getState) => {
    const original = selectTaskById(getState(), id);
    if (!original) return null;

    const { payload } = dispatch(taskDuplicated(id));
    dispatch(toastShown({ message: { key: "toast.duplicated", params: { title: original.title } } }));
    return payload.copyId;
  };

// Removes tasks and offers to restore them in place
export const removeTasks =
  (ids: readonly string[], cleared = false): AppThunk =>
  (dispatch, getState) => {
    const { tasks } = getState();
    const removed = ids.flatMap((id): RemovedTask[] => {
      const task = tasks.entities[id];
      return task ? [{ task, index: tasks.ids.indexOf(id) }] : [];
    });

    const [first] = removed;
    if (!first) return;

    const removedIds = removed.map(({ task }) => task.id);
    dispatch(tasksRemoved(removedIds));
    const detailsId = selectDetailsId(getState());
    if (detailsId !== null && removedIds.includes(detailsId)) dispatch(detailsClosed());

    const count = removed.length;
    const message: ToastMessage = cleared
      ? { key: "toast.cleared", params: { count } }
      : count === 1
        ? { key: "toast.deletedOne", params: { title: first.task.title } }
        : { key: "toast.deletedMany", params: { count } };

    dispatch(toastShown({ message, action: { type: "restore", tasks: removed } }));
  };

// Removes every completed task
export const clearCompleted = (): AppThunk => (dispatch, getState) => {
  dispatch(removeTasks(selectCompletedIds(getState()), true));
};

// Restores the tasks of the last removal toast
export const undoRemoval = (): AppThunk => (dispatch, getState) => {
  const toast = selectToast(getState());
  if (toast?.action?.type !== "restore") return;

  dispatch(tasksRestored(toast.action.tasks));
  dispatch(toastDismissed(toast.id));
};

// A task dropped on a list or project changes to match it
export const dropTask =
  (id: string, target: ViewId, today: string): AppThunk<boolean> =>
  (dispatch, getState) => {
    const task = selectTaskById(getState(), id);
    if (!task) return false;
    const before = getState().tasks;

    if (isProjectView(target)) dispatch(taskProjectChanged(id, projectIdOf(target)));
    else if (target === "today") dispatch(taskScheduled(id, today));
    else if (target === "upcoming" && (task.dueDate === null || task.dueDate <= today))
      dispatch(taskScheduled(id, addDays(today, 1)));
    else if (target === "important" && !task.important) dispatch(taskImportanceToggled(id));
    else if (target === "completed" && !task.completed) dispatch(taskToggled(id));

    if (getState().tasks === before) return false;
    dispatch(
      toastShown({
        message: { key: "toast.dropped", params: { title: task.title, target: viewName(getState(), target) } },
        action: { type: "undo" },
      }),
    );
    return true;
  };
