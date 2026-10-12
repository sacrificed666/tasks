import { detectLocale, isLocale, type Locale } from "@/shared/i18n/locales";
import { prefersRichEffects, setEffectsLevel, type EffectsLevel } from "@/shared/lib/effects";
import { isRecord } from "@/shared/lib/guards";

import {
  applyTheme,
  DEFAULT_THEME,
  isAccent,
  isAppearance,
  isBackdrop,
  isGlassStyle,
  type ThemeSettings,
} from "./theme";

export const EFFECTS = ["auto", "full", "reduced"] as const;

export type Effects = (typeof EFFECTS)[number];

export interface Settings extends ThemeSettings {
  locale: Locale;
  effects: Effects;
}

export const DEFAULT_SETTINGS: Settings = { ...DEFAULT_THEME, locale: "en", effects: "auto" };

// Whether a value is a valid effects choice
const isEffects = (value: unknown): value is Effects =>
  typeof value === "string" && (EFFECTS as readonly string[]).includes(value);

// Auto becomes full on Apple devices and reduced elsewhere
export const resolveEffects = (effects: Effects, rich: boolean = prefersRichEffects()): EffectsLevel => {
  if (effects !== "auto") return effects;
  return rich ? "full" : "reduced";
};

// Saved settings with defaults for anything missing or invalid
export const readSettings = (stored: unknown, languages: readonly string[]): Settings => {
  const value = isRecord(stored) ? stored : {};
  return {
    appearance: isAppearance(value.appearance) ? value.appearance : DEFAULT_SETTINGS.appearance,
    accent: isAccent(value.accent) ? value.accent : DEFAULT_SETTINGS.accent,
    backdrop: isBackdrop(value.backdrop) ? value.backdrop : DEFAULT_SETTINGS.backdrop,
    glass: isGlassStyle(value.glass) ? value.glass : DEFAULT_SETTINGS.glass,
    locale: isLocale(value.locale) ? value.locale : detectLocale(languages),
    effects: isEffects(value.effects) ? value.effects : DEFAULT_SETTINGS.effects,
  };
};

// Puts theme, language and effects on the document
export const applySettings = (settings: Settings, root: HTMLElement = document.documentElement) => {
  applyTheme(settings, root);
  root.lang = settings.locale;
  const level = resolveEffects(settings.effects);
  root.dataset.effects = level;
  setEffectsLevel(level);
};
