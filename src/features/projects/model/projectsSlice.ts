import { createEntityAdapter, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { dataImported, dataReplaced } from "@/features/data/model/actions";

import { createProject, normalizeProjectName, type Project, type ProjectColor, type ProjectDraft } from "./project";

export interface ProjectChanges {
  name: string;
  color: ProjectColor;
}

export const projectsAdapter = createEntityAdapter<Project>();

// Projects in the order of the sidebar
export const projectsSlice = createSlice({
  name: "projects",
  initialState: projectsAdapter.getInitialState(),
  reducers: {
    projectAdded: {
      reducer(state, action: PayloadAction<Project>) {
        const project = action.payload;
        if (!project.name || project.id in state.entities) return;
        projectsAdapter.addOne(state, project);
      },
      prepare: (draft: ProjectDraft) => ({ payload: createProject(draft, Date.now()) }),
    },
    projectUpdated: {
      reducer(state, action: PayloadAction<ProjectChanges & { id: string; at: number }>) {
        const { id, color, at } = action.payload;
        const project = state.entities[id];
        const name = normalizeProjectName(action.payload.name);
        if (!project || !name || (project.name === name && project.color === color)) return;
        project.name = name;
        project.color = color;
        project.updatedAt = at;
      },
      prepare: (id: string, changes: ProjectChanges) => ({ payload: { id, ...changes, at: Date.now() } }),
    },
    projectMoved(state, action: PayloadAction<{ activeId: string; overId: string }>) {
      const from = state.ids.indexOf(action.payload.activeId);
      const to = state.ids.indexOf(action.payload.overId);
      if (from === -1 || to === -1 || from === to) return;
      const [id] = state.ids.splice(from, 1);
      if (id !== undefined) state.ids.splice(to, 0, id);
    },
    projectRemoved(state, action: PayloadAction<string>) {
      projectsAdapter.removeOne(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(dataReplaced, (state, action) => {
        projectsAdapter.setAll(state, action.payload.projects);
      })
      .addCase(dataImported, (state, action) => {
        projectsAdapter.addMany(
          state,
          action.payload.projects.filter((project) => !(project.id in state.entities)),
        );
      });
  },
});

export const { projectAdded, projectUpdated, projectMoved, projectRemoved } = projectsSlice.actions;
