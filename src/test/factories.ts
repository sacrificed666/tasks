import type { RootState } from "@/app/store";
import type { ViewId } from "@/features/lists/model/lists";
import { initialViewState } from "@/features/lists/model/viewSlice";
import type { Project } from "@/features/projects/model/project";
import { projectsAdapter } from "@/features/projects/model/projectsSlice";
import type { Task } from "@/features/tasks/model/task";
import { tasksAdapter } from "@/features/tasks/model/tasksSlice";
import { addDays, toDateKey } from "@/shared/lib/date";

// Today as a date key
export const todayKey = () => toDateKey(new Date());

// A date key some days from today
export const dayFromToday = (offset: number) => addDays(todayKey(), offset);

// A task with defaults, with fields to override
export const makeTask = (overrides: Partial<Task> & Pick<Task, "id" | "title">): Task => ({
  completed: false,
  important: false,
  dueDate: null,
  repeat: null,
  repeatAnchor: null,
  projectId: null,
  tags: [],
  notes: "",
  subtasks: [],
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  completedAt: null,
  ...overrides,
});

// A project with defaults, with fields to override
export const makeProject = (overrides: Partial<Project> & Pick<Project, "id" | "name">): Project => ({
  color: "blue",
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  ...overrides,
});

// A preloaded store state with tasks, view, search and projects
export const makeState = (
  tasks: readonly Task[],
  list: ViewId = "all",
  query = "",
  projects: readonly Project[] = [],
): Partial<RootState> => ({
  tasks: tasksAdapter.setAll(tasksAdapter.getInitialState(), tasks),
  projects: projectsAdapter.setAll(projectsAdapter.getInitialState(), projects),
  view: { ...initialViewState, list, query },
});

export const sampleTasks = [
  makeTask({ id: "milk", title: "Buy milk" }),
  makeTask({ id: "report", title: "Write the quarterly report", completed: true, completedAt: 1_700_000_100_000 }),
  makeTask({ id: "call", title: "Call grandma" }),
];
