import { toDateKey } from "@/shared/lib/date";

import type { DataSnapshot } from "./actions";
import { parseData } from "./document";

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_TASKS = 5000;

// The export document with its date
export const createExport = ({ tasks, projects }: DataSnapshot, exportedAt: Date) => ({
  app: "tasks",
  exportedAt: exportedAt.toISOString(),
  tasks,
  projects,
});

// The name of an export file
export const exportFileName = (date: Date) => `tasks-${toDateKey(date)}.json`;

// Tasks and projects of an import file, within the size limits
export const readImport = (text: string): DataSnapshot | null => {
  if (text.length > MAX_IMPORT_BYTES) return null;

  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    return null;
  }

  const snapshot = parseData(data);
  return snapshot ? { tasks: snapshot.tasks.slice(0, MAX_IMPORT_TASKS), projects: snapshot.projects } : null;
};
