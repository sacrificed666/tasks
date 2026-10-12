import { combineSlices, configureStore, type ThunkAction, type UnknownAction } from "@reduxjs/toolkit";

import { historySlice, withHistory } from "@/features/data/model/history";
import { viewSlice } from "@/features/lists/model/viewSlice";
import { toastSlice } from "@/features/notifications/model/toastSlice";
import { projectsSlice } from "@/features/projects/model/projectsSlice";
import { settingsSlice } from "@/features/settings/model/settingsSlice";
import { tasksSlice } from "@/features/tasks/model/tasksSlice";

export const rootReducer = withHistory(
  combineSlices(tasksSlice, projectsSlice, viewSlice, settingsSlice, toastSlice, historySlice),
);

export type RootState = ReturnType<typeof rootReducer>;

// The Redux store with undo history, started from an optional saved state
export const setupStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
  });

export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<Result = void> = ThunkAction<Result, RootState, unknown, UnknownAction>;
