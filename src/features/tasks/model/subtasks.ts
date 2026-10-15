import { nanoid } from "@reduxjs/toolkit";

import { isEntityId, isRecord } from "@/shared/lib/guards";
import { normalizeLine } from "@/shared/lib/text";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export const MAX_SUBTASKS = 50;
export const MAX_SUBTASK_LENGTH = 200;

// A subtask title on one line within the length limit
export const normalizeSubtaskTitle = (value: string) => normalizeLine(value, MAX_SUBTASK_LENGTH);

// A new open subtask
export const createSubtask = (title: string, id: string = nanoid()): Subtask => ({
  id,
  title: normalizeSubtaskTitle(title),
  completed: false,
});

// Valid subtasks from stored or imported data, with unique ids
export const parseSubtasks = (list: readonly unknown[]): Subtask[] => {
  const seen = new Set<string>();
  return list
    .flatMap((entry) => {
      if (!isRecord(entry) || typeof entry.title !== "string") return [];
      const title = normalizeSubtaskTitle(entry.title);
      if (!title) return [];
      const id = typeof entry.id === "string" && isEntityId(entry.id) && !seen.has(entry.id) ? entry.id : nanoid();
      seen.add(id);
      return [{ id, title, completed: entry.completed === true }];
    })
    .slice(0, MAX_SUBTASKS);
};

// Done and total subtasks
export const subtaskProgress = (subtasks: readonly Subtask[]) => ({
  done: subtasks.filter((subtask) => subtask.completed).length,
  total: subtasks.length,
});
