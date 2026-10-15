import { createContext } from "react";

import type { Locale } from "./locales";

export interface I18nValue {
  locale: Locale;
}

export const I18nContext = createContext<I18nValue | null>(null);
