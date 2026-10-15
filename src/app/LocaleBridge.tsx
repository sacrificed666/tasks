import type { ReactNode } from "react";

import I18nProvider from "@/shared/i18n/I18nProvider";

import { useAppSelector } from "./hooks";

interface LocaleBridgeProps {
  children: ReactNode;
}

// Hands the language chosen in the settings to every component
const LocaleBridge = ({ children }: LocaleBridgeProps) => {
  const locale = useAppSelector((state) => state.settings.locale);
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
};

export default LocaleBridge;
