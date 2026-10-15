export const APPEARANCES = ["system", "light", "dark"] as const;
export const ACCENTS = [
  "blue",
  "indigo",
  "violet",
  "pink",
  "rose",
  "sunset",
  "amber",
  "forest",
  "mint",
  "graphite",
] as const;
export const BACKDROPS = ["aurora", "spectrum", "sunset", "ocean", "nebula", "plain"] as const;
export const GLASS_STYLES = ["clear", "tinted"] as const;

export type Appearance = (typeof APPEARANCES)[number];
export type Accent = (typeof ACCENTS)[number];
export type Backdrop = (typeof BACKDROPS)[number];
export type GlassStyle = (typeof GLASS_STYLES)[number];

export interface ThemeSettings {
  appearance: Appearance;
  accent: Accent;
  backdrop: Backdrop;
  glass: GlassStyle;
}

export const DEFAULT_THEME: ThemeSettings = {
  appearance: "system",
  accent: "blue",
  backdrop: "aurora",
  glass: "clear",
};

const THEME_COLORS: Record<"light" | "dark", string> = { light: "#e8edf6", dark: "#070a14" };

// A guard for a list of allowed values
const isOneOf =
  <Value extends string>(values: readonly Value[]) =>
  (value: unknown): value is Value =>
    typeof value === "string" && (values as readonly string[]).includes(value);

export const isAppearance = isOneOf(APPEARANCES);
export const isAccent = isOneOf(ACCENTS);
export const isBackdrop = isOneOf(BACKDROPS);
export const isGlassStyle = isOneOf(GLASS_STYLES);

// Light or dark, following the system for the system choice
export const resolveAppearance = (appearance: Appearance) => {
  if (appearance !== "system") return appearance;
  return globalThis.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

// The browser colour for a theme-color tag: the picked appearance, or its media
const themeColorFor = (appearance: Appearance, media: string | null) => {
  if (appearance !== "system") return THEME_COLORS[appearance];
  if (media === null) return THEME_COLORS[resolveAppearance(appearance)];
  return media.includes("light") ? THEME_COLORS.light : THEME_COLORS.dark;
};

// Theme attributes on the document and the browser colour
export const applyTheme = (
  { appearance, accent, backdrop, glass }: ThemeSettings,
  root: HTMLElement = document.documentElement,
) => {
  root.dataset.appearance = appearance;
  root.dataset.accent = accent;
  root.dataset.backdrop = backdrop;
  root.dataset.glass = glass;
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = themeColorFor(appearance, meta.getAttribute("media"));
  }
};
