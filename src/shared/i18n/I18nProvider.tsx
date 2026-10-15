import type { ReactNode } from "react";

import { I18nContext, type I18nValue } from "./context";

interface I18nProviderProps extends I18nValue {
  children: ReactNode;
}

// Gives components the language whose messages are loaded
const I18nProvider = ({ locale, children }: I18nProviderProps) => (
  <I18nContext value={{ locale }}>{children}</I18nContext>
);

export default I18nProvider;
