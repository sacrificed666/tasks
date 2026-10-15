import type { Task } from "@/features/tasks/model/task";
import { toDateKey } from "@/shared/lib/date";
import { isEntityId } from "@/shared/lib/guards";

export const LISTS = ["all", "today", "upcoming", "important", "completed"] as const;

export type ListId = (typeof LISTS)[number];

export type ProjectView = `project:${string}`;

export type ViewId = ListId | ProjectView;

const PROJECT_PREFIX = "project:";

// Whether a value is one of the smart lists
export const isListId = (value: unknown): value is ListId =>
  typeof value === "string" && (LISTS as readonly string[]).includes(value);

// The view of a project
export const projectView = (projectId: string): ProjectView => `project:${projectId}`;

// Whether a view shows a project
export const isProjectView = (view: ViewId): view is ProjectView => view.startsWith(PROJECT_PREFIX);

// The project of a view, or null for a smart list
export const projectIdOf = (view: ViewId) => (isProjectView(view) ? view.slice(PROJECT_PREFIX.length) : null);

// Whether a value is a smart list or a project view
export const isViewId = (value: unknown): value is ViewId =>
  isListId(value) ||
  (typeof value === "string" && value.startsWith(PROJECT_PREFIX) && isEntityId(value.slice(PROJECT_PREFIX.length)));

// Whether a task was completed on a day
const completedOn = (task: Task, day: string) =>
  task.completedAt !== null && toDateKey(new Date(task.completedAt)) === day;

// Whether a task belongs to a smart list
export const matchesList = (task: Task, list: ListId, today: string) => {
  switch (list) {
    case "all":
      return true;
    case "today":
      return task.dueDate !== null && task.dueDate <= today && (!task.completed || completedOn(task, today));
    case "upcoming":
      return task.dueDate !== null && task.dueDate > today;
    case "important":
      return task.important;
    case "completed":
      return task.completed;
  }
};

// Whether a task belongs to a list or a project
export const matchesView = (task: Task, view: ViewId, today: string) =>
  isProjectView(view) ? task.projectId === projectIdOf(view) : matchesList(task, view, today);

// An open task whose date has passed
export const isOverdue = (task: Task, today: string) =>
  !task.completed && task.dueDate !== null && task.dueDate < today;
