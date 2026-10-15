import type { Task } from "@/features/tasks/model/task";

export const SORT_MODES = ["manual", "dueDate", "priority", "newest", "alphabetical"] as const;

export type SortMode = (typeof SORT_MODES)[number];

// Whether a value is a sort order
export const isSortMode = (value: unknown): value is SortMode =>
  typeof value === "string" && (SORT_MODES as readonly string[]).includes(value);

// Earlier dates first, tasks without a date last
const byDueDate = (a: Task, b: Task) => {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
};

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

// Tasks in the chosen order; manual keeps the dragged order
export const sortTasks = (tasks: readonly Task[], mode: SortMode): readonly Task[] => {
  switch (mode) {
    case "manual":
      return tasks;
    case "dueDate":
      return tasks.toSorted(byDueDate);
    case "priority":
      return tasks.toSorted((a, b) => Number(b.important) - Number(a.important));
    case "newest":
      return tasks.toSorted((a, b) => b.createdAt - a.createdAt);
    case "alphabetical":
      return tasks.toSorted((a, b) => collator.compare(a.title, b.title));
  }
};
