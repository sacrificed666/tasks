import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { Locale } from "@/shared/i18n/locales";

import { DEFAULT_SETTINGS, type Effects } from "./settings";
import type { Accent, Appearance, Backdrop, GlassStyle } from "./theme";

// Appearance, accent, backdrop, glass, language and effects
export const settingsSlice = createSlice({
  name: "settings",
  initialState: { ...DEFAULT_SETTINGS },
  reducers: {
    appearanceChanged(state, action: PayloadAction<Appearance>) {
      state.appearance = action.payload;
    },
    accentChanged(state, action: PayloadAction<Accent>) {
      state.accent = action.payload;
    },
    backdropChanged(state, action: PayloadAction<Backdrop>) {
      state.backdrop = action.payload;
    },
    glassChanged(state, action: PayloadAction<GlassStyle>) {
      state.glass = action.payload;
    },
    localeChanged(state, action: PayloadAction<Locale>) {
      state.locale = action.payload;
    },
    effectsChanged(state, action: PayloadAction<Effects>) {
      state.effects = action.payload;
    },
  },
});

export const { appearanceChanged, accentChanged, backdropChanged, glassChanged, localeChanged, effectsChanged } =
  settingsSlice.actions;
