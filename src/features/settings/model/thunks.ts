import type { AppThunk } from "@/app/store";
import { toastShown } from "@/features/notifications/model/toastSlice";
import { loadMessages } from "@/shared/i18n/catalog";
import type { Locale } from "@/shared/i18n/locales";

import { localeChanged } from "./settingsSlice";

// Loads a language first and switches only when it arrived
export const changeLocale =
  (locale: Locale): AppThunk<Promise<boolean>> =>
  async (dispatch) => {
    try {
      await loadMessages(locale);
    } catch {
      dispatch(toastShown({ message: { key: "toast.languageFailed" }, tone: "error" }));
      return false;
    }
    dispatch(localeChanged(locale));
    return true;
  };
