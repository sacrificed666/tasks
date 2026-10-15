import { use } from "react";

import { I18nContext } from "./context";
import { LOCALE_INFO } from "./locales";
import { createTranslator } from "./translate";

// Language, translator and Intl locale for components
export const useI18n = () => {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return { locale: value.locale, intlLocale: LOCALE_INFO[value.locale].intl, t: createTranslator(value.locale) };
};
