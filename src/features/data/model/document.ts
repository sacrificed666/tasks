import { parseProjects } from "@/features/projects/model/project";
import { parseTasks, type Task } from "@/features/tasks/model/task";

import type { DataSnapshot } from "./actions";

// Tasks of a project that no longer exists move to no project
export const linkProjects = (tasks: readonly Task[], projectIds: ReadonlySet<string>): Task[] =>
  tasks.map((task) =>
    task.projectId === null || projectIds.has(task.projectId) ? task : { ...task, projectId: null },
  );

// Valid tasks and projects of a document, or null
export const parseData = (input: unknown, now: number = Date.now()): DataSnapshot | null => {
  const tasks = parseTasks(input, now);
  if (!tasks) return null;
  const projects = parseProjects(input, now);
  return { tasks: linkProjects(tasks, new Set(projects.map((project) => project.id))), projects };
};

// Tasks and projects as stored text
export const serializeData = ({ tasks, projects }: DataSnapshot) => JSON.stringify({ tasks, projects });
