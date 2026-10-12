import { getMessages } from "./catalog";
import { LOCALE_INFO, type Locale } from "./locales";
import type { en } from "./messages/en";

export type PluralMessage = Readonly<Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }>;
export type Message = string | PluralMessage;
export type MessageKey = keyof typeof en;
export type Messages = Readonly<Record<MessageKey, Message>>;
export type TranslationParams = Readonly<Record<string, string | number>>;
export type Translate = (key: MessageKey, params?: TranslationParams) => string;

const pluralRules = new Map<Locale, Intl.PluralRules>();

// The plural form of a count in a language
export const pluralCategory = (locale: Locale, count: number) => {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(LOCALE_INFO[locale].intl);
    pluralRules.set(locale, rules);
  }
  return rules.select(count);
};

// A message with its plural form picked and placeholders filled
export const translate = (locale: Locale, key: MessageKey, params: TranslationParams = {}) => {
  const message = getMessages(locale)[key];
  const template =
    typeof message === "string"
      ? message
      : (message[pluralCategory(locale, Number(params.count ?? 0))] ?? message.other);
  return template.replaceAll(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
};

// A translate function bound to one language
export const createTranslator =
  (locale: Locale): Translate =>
  (key, params) =>
    translate(locale, key, params);
