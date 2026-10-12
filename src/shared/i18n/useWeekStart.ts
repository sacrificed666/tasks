import { firstDayOfWeek } from "@/shared/lib/date";

import { LOCALE_INFO } from "./locales";
import { useI18n } from "./useI18n";

// The first day of the week for the language and the browser region
export const useWeekStart = () => {
  const { locale } = useI18n();
  const regional = globalThis.navigator.languages.find((language) => language.split("-")[0] === locale);
  return firstDayOfWeek(regional ?? LOCALE_INFO[locale].intl);
};
