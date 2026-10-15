import type { Locale } from "./locales";
import { en } from "./messages/en";
import type { Messages } from "./translate";

type LazyLocale = Exclude<Locale, "en">;

const loaders: Readonly<Record<LazyLocale, () => Promise<Messages>>> = {
  uk: async () => (await import("./messages/uk")).uk,
  cs: async () => (await import("./messages/cs")).cs,
  de: async () => (await import("./messages/de")).de,
  es: async () => (await import("./messages/es")).es,
  fr: async () => (await import("./messages/fr")).fr,
  it: async () => (await import("./messages/it")).it,
  nl: async () => (await import("./messages/nl")).nl,
  pl: async () => (await import("./messages/pl")).pl,
  pt: async () => (await import("./messages/pt")).pt,
};

const catalog = new Map<Locale, Messages>([["en", en]]);

// The loaded messages of a language, English until they arrive
export const getMessages = (locale: Locale): Messages => catalog.get(locale) ?? en;

// Loads the messages of a language once
export const loadMessages = async (locale: Locale) => {
  if (locale === "en" || catalog.has(locale)) return;
  catalog.set(locale, await loaders[locale]());
};
