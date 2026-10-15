export const LOCALES = ["en", "uk", "cs", "de", "es", "fr", "it", "nl", "pl", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

interface LocaleInfo {
  name: string;
  flag: string;
  intl: string;
}

export const LOCALE_INFO: Readonly<Record<Locale, LocaleInfo>> = {
  en: { name: "English", flag: "GB", intl: "en-GB" },
  uk: { name: "Українська", flag: "UA", intl: "uk-UA" },
  cs: { name: "Čeština", flag: "CZ", intl: "cs-CZ" },
  de: { name: "Deutsch", flag: "DE", intl: "de-DE" },
  es: { name: "Español", flag: "ES", intl: "es-ES" },
  fr: { name: "Français", flag: "FR", intl: "fr-FR" },
  it: { name: "Italiano", flag: "IT", intl: "it-IT" },
  nl: { name: "Nederlands", flag: "NL", intl: "nl-NL" },
  pl: { name: "Polski", flag: "PL", intl: "pl-PL" },
  pt: { name: "Português", flag: "PT", intl: "pt-PT" },
};

// Whether a value is a supported language
export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

// The first supported language of the browser, or English
export const detectLocale = (languages: readonly string[]): Locale => {
  for (const language of languages) {
    const primary = language.toLowerCase().split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return "en";
};
