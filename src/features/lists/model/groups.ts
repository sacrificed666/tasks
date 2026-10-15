import type { Task } from "@/features/tasks/model/task";
import { daysBetween } from "@/shared/lib/date";

import type { ViewId } from "./lists";

export type TaskGroupKind = "overdue" | "day" | "month" | "all";

export interface TaskGroup {
  id: string;
  kind: TaskGroupKind;
  date: string | null;
  tasks: readonly Task[];
}

const DAYS_SHOWN_ONE_BY_ONE = 7;

// Upcoming tasks by day for a week, then by month
const groupUpcoming = (tasks: readonly Task[], today: string): TaskGroup[] => {
  const groups = new Map<
    string,
    { sortKey: string; group: { id: string; kind: TaskGroupKind; date: string; tasks: Task[] } }
  >();

  for (const task of tasks) {
    const date = task.dueDate ?? today;
    const byDay = daysBetween(today, date) <= DAYS_SHOWN_ONE_BY_ONE;
    const month = date.slice(0, 7);
    const id = byDay ? `day-${date}` : `month-${month}`;
    const entry = groups.get(id);
    if (entry) entry.group.tasks.push(task);
    else
      groups.set(id, {
        sortKey: byDay ? date : `${month}-99`,
        group: { id, kind: byDay ? "day" : "month", date: byDay ? date : `${month}-01`, tasks: [task] },
      });
  }

  return [...groups.values()].toSorted((a, b) => a.sortKey.localeCompare(b.sortKey)).map(({ group }) => group);
};

// Open tasks in sections: overdue and today, days, months or one
export const groupActiveTasks = (tasks: readonly Task[], list: ViewId, today: string): TaskGroup[] => {
  if (tasks.length === 0) return [];

  if (list === "today") {
    const overdue = tasks.filter((task) => task.dueDate !== null && task.dueDate < today);
    const due = tasks.filter((task) => !overdue.includes(task));
    return [
      ...(overdue.length > 0 ? [{ id: "overdue", kind: "overdue" as const, date: null, tasks: overdue }] : []),
      ...(due.length > 0 ? [{ id: "today", kind: "day" as const, date: today, tasks: due }] : []),
    ];
  }

  if (list === "upcoming") return groupUpcoming(tasks, today);

  return [{ id: "active", kind: "all", date: null, tasks }];
};
