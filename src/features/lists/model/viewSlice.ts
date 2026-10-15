import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { projectRemoved } from "@/features/projects/model/projectsSlice";

import { projectView, type ViewId } from "./lists";
import type { SortMode } from "./sort";

export type Overlay =
  | { kind: "palette" }
  | { kind: "settings" }
  | { kind: "lists" }
  | { kind: "project"; projectId: string | null };

export interface ViewState {
  list: ViewId;
  query: string;
  sort: SortMode;
  showCompleted: boolean;
  detailsId: string | null;
  overlay: Overlay | null;
}

export type ViewPreferences = Pick<ViewState, "list" | "sort" | "showCompleted">;

export const initialViewState: ViewState = {
  list: "all",
  query: "",
  sort: "manual",
  showCompleted: true,
  detailsId: null,
  overlay: null,
};

// What is on screen: list, search, sort, open task and overlay
export const viewSlice = createSlice({
  name: "view",
  initialState: initialViewState,
  reducers: {
    listChanged(state, action: PayloadAction<ViewId>) {
      state.list = action.payload;
      state.query = "";
    },
    queryChanged(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    sortChanged(state, action: PayloadAction<SortMode>) {
      state.sort = action.payload;
    },
    completedVisibilityToggled(state) {
      state.showCompleted = !state.showCompleted;
    },
    detailsOpened(state, action: PayloadAction<string>) {
      state.detailsId = action.payload;
    },
    detailsClosed(state) {
      state.detailsId = null;
    },
    overlayOpened(state, action: PayloadAction<Overlay>) {
      state.overlay = action.payload;
    },
    overlayClosed(state, action: PayloadAction<Overlay["kind"]>) {
      if (state.overlay?.kind === action.payload) state.overlay = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(projectRemoved, (state, action) => {
      if (state.list === projectView(action.payload)) state.list = "all";
      if (state.overlay?.kind === "project" && state.overlay.projectId === action.payload) state.overlay = null;
    });
  },
});

export const {
  listChanged,
  queryChanged,
  sortChanged,
  completedVisibilityToggled,
  detailsOpened,
  detailsClosed,
  overlayOpened,
  overlayClosed,
} = viewSlice.actions;
