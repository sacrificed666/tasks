import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "@/app/store";
import type { Project } from "@/features/projects/model/project";
import { selectProjects } from "@/features/projects/model/selectors";
import { selectTasks } from "@/features/tasks/model/selectors";
import { addDays, toDateKey } from "@/shared/lib/date";

// Passes today's date through to the selectors
const selectToday = (_state: RootState, today: string) => today;

// Completions of the last seven days and the current streak
export const selectActivity = createSelector([selectTasks, selectToday], (tasks, today) => {
  const completions = new Map<string, number>();
  for (const task of tasks) {
    if (!task.completed || task.completedAt === null) continue;
    const day = toDateKey(new Date(task.completedAt));
    completions.set(day, (completions.get(day) ?? 0) + 1);
  }

  const days = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(today, index - 6);
    return { day, count: completions.get(day) ?? 0 };
  });

  let streak = 0;
  let cursor = completions.has(today) ? today : addDays(today, -1);
  while ((completions.get(cursor) ?? 0) > 0) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return { days, streak };
});

export interface ProjectProgress {
  project: Project;
  done: number;
  total: number;
}

// Done and total tasks of every project with tasks
export const selectProjectProgress = createSelector([selectTasks, selectProjects], (tasks, projects) => {
  const totals = new Map<string, { done: number; total: number }>();
  for (const task of tasks) {
    if (task.projectId === null) continue;
    const entry = totals.get(task.projectId) ?? { done: 0, total: 0 };
    entry.total += 1;
    if (task.completed) entry.done += 1;
    totals.set(task.projectId, entry);
  }
  return projects.flatMap((project): ProjectProgress[] => {
    const entry = totals.get(project.id);
    return entry ? [{ project, ...entry }] : [];
  });
});
