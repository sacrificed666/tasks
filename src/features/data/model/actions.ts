import { createAction } from "@reduxjs/toolkit";

import type { Project } from "@/features/projects/model/project";
import type { Task } from "@/features/tasks/model/task";

export interface DataSnapshot {
  tasks: readonly Task[];
  projects: readonly Project[];
}

export const dataReplaced = createAction<DataSnapshot>("data/replaced");
export const dataImported = createAction<DataSnapshot>("data/imported");
