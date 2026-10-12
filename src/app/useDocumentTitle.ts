import { useEffect } from "react";

import { useViewInfo } from "@/features/lists/model/useViewInfo";
import { useI18n } from "@/shared/i18n/useI18n";

// The tab title names the current list or project, or says what the app is
export const useDocumentTitle = () => {
  const { t } = useI18n();
  const view = useViewInfo();
  const name = t("app.name");
  const title =
    view.kind === "list" && view.list === "all" ? `${name} · ${t("app.tagline")}` : `${view.title} · ${name}`;

  // Updates the tab title
  useEffect(() => {
    document.title = title;
  }, [title]);
};
