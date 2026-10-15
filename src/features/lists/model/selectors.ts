import type { RootState } from "@/app/store";

import { projectIdOf, type ViewId } from "./lists";
import type { Overlay } from "./viewSlice";

// The current view, or All when its project is gone
export const selectList = (state: RootState): ViewId => {
  const { list } = state.view;
  const projectId = projectIdOf(list);
  return projectId === null || projectId in state.projects.entities ? list : "all";
};

// The project of the current view, if any
export const selectCurrentProject = (state: RootState) => {
  const projectId = projectIdOf(state.view.list);
  return projectId === null ? undefined : state.projects.entities[projectId];
};

// The search text
export const selectQuery = (state: RootState) => state.view.query;
// Whether a search is active
export const selectSearching = (state: RootState) => state.view.query.trim() !== "";
// The sort order
export const selectSort = (state: RootState) => state.view.sort;
// Whether completed tasks are shown
export const selectShowCompleted = (state: RootState) => state.view.showCompleted;
// The task open in the details
export const selectDetailsId = (state: RootState) => state.view.detailsId;
// The open dialog or sheet
export const selectOverlay = (state: RootState) => state.view.overlay;
// The kind of the open overlay
export const selectOverlayKind = (state: RootState): Overlay["kind"] | null => state.view.overlay?.kind ?? null;
// Whether the command palette is open
export const selectPaletteOpen = (state: RootState) => state.view.overlay?.kind === "palette";
