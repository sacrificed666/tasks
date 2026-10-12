import type { RootState } from "@/app/store";

// Theme, language and effects
export const selectSettings = (state: RootState) => state.settings;
