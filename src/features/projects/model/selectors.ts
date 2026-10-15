import type { RootState } from "@/app/store";

import { projectsAdapter } from "./projectsSlice";

const projectSelectors = projectsAdapter.getSelectors((state: RootState) => state.projects);

export const selectProjects = projectSelectors.selectAll;
export const selectProjectById = projectSelectors.selectById;
