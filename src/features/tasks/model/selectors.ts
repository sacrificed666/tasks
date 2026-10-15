import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/app/store";
import { isOverdue, matchesList, matchesView, type ListId } from "@/features/lists/model/lists";
import { selectList, selectQuery, selectSort } from "@/features/lists/model/selectors";
import { sortTasks } from "@/features/lists/model/sort";

import { createMatcher } from "./task";
import { tasksAdapter } from "./tasksSlice";

const taskSelectors = tasksAdapter.getSelectors((state: RootState) => state.tasks);

export const selectTasks = taskSelectors.selectAll;
export const selectTaskById = taskSelectors.selectById;

// Passes today's date through to the selectors
const selectToday = (_state: RootState, today: string) => today;

export type ListCounts = Record<ListId, number> & { overdue: number; total: number };

// Open tasks per smart list, overdue and totals
export const selectListCounts = createSelector([selectTasks, selectToday], (tasks, today): ListCounts => {
  const active = tasks.filter((task) => !task.completed);
  // The open tasks of a list
  const countActive = (list: ListId) => active.filter((task) => matchesList(task, list, today)).length;

  return {
    all: active.length,
    today: countActive("today"),
    upcoming: countActive("upcoming"),
    important: countActive("important"),
    completed: tasks.length - active.length,
    overdue: active.filter((task) => isOverdue(task, today)).length,
    total: tasks.length,
  };
});

// Ids of all completed tasks
export const selectCompletedIds = createSelector([selectTasks], (tasks) =>
  tasks.filter((task) => task.completed).map((task) => task.id),
);

// Open tasks per project
export const selectProjectCounts = createSelector([selectTasks], (tasks): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.completed || task.projectId === null) continue;
    counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
  }
  return counts;
});

// Open tasks per due date, for the calendar dots
export const selectDueDateCounts = createSelector([selectTasks], (tasks): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (task.completed || task.dueDate === null) continue;
    counts.set(task.dueDate, (counts.get(task.dueDate) ?? 0) + 1);
  }
  return counts;
});

// Done and total tasks of the current view
export const selectListProgress = createSelector([selectTasks, selectList, selectToday], (tasks, list, today) => {
  const inList = tasks.filter((task) => matchesView(task, list, today));
  return { done: inList.filter((task) => task.completed).length, total: inList.length };
});

// A given query, or the search text
const selectQueryArgument = (state: RootState, _today: string, query?: string) => query ?? selectQuery(state);

// Open and completed tasks of the view or search, sorted
export const selectVisibleTasks = createSelector(
  [selectTasks, selectList, selectQueryArgument, selectSort, selectToday],
  (tasks, list, query, sort, today) => {
    const searching = query.trim() !== "";
    const matches = createMatcher(query);
    const visible = tasks.filter((task) =>
      searching
        ? matches(task.title) ||
          task.tags.some(matches) ||
          matches(task.notes) ||
          task.subtasks.some((subtask) => matches(subtask.title))
        : matchesView(task, list, today),
    );
    return {
      active: sortTasks(
        visible.filter((task) => !task.completed),
        sort,
      ),
      completed: sortTasks(
        visible.filter((task) => task.completed),
        sort,
      ),
    };
  },
);

export interface TagCount {
  tag: string;
  count: number;
}

// Tags of open tasks with their counts, the most used first
export const selectTagCounts = createSelector([selectTasks], (tasks): TagCount[] => {
  const counts = new Map<string, TagCount>();
  for (const task of tasks) {
    if (task.completed) continue;
    const seen = new Set<string>();
    for (const tag of task.tags) {
      const key = tag.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key);
      counts.set(key, { tag: entry?.tag ?? tag, count: (entry?.count ?? 0) + 1 });
    }
  }
  return [...counts.values()].toSorted((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
});

// Every tag in use, those of open tasks first, for picking tags
export const selectAllTags = createSelector([selectTasks, selectTagCounts], (tasks, open): string[] => {
  const seen = new Set(open.map(({ tag }) => tag.toLocaleLowerCase()));
  const rest: string[] = [];
  for (const tag of tasks.flatMap((task) => task.tags)) {
    const key = tag.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rest.push(tag);
  }
  return [...open.map(({ tag }) => tag), ...rest.toSorted((a, b) => a.localeCompare(b))];
});
