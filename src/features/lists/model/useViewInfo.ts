import { useAppSelector } from "@/app/hooks";
import { splitProjectName, type Project } from "@/features/projects/model/project";
import { useI18n } from "@/shared/i18n/useI18n";

import { isProjectView, type ListId } from "./lists";
import { selectCurrentProject, selectList, selectQuery } from "./selectors";

export type ViewInfo =
  | { kind: "search"; title: string; query: string }
  | { kind: "list"; title: string; list: ListId }
  | { kind: "project"; title: string; project: Project };

// What the main area shows: a search, a list or a project
export const useViewInfo = (): ViewInfo => {
  const { t } = useI18n();
  const list = useAppSelector(selectList);
  const query = useAppSelector(selectQuery).trim();
  const project = useAppSelector(selectCurrentProject);

  if (query) return { kind: "search", title: t("search.title"), query };
  if (!isProjectView(list)) return { kind: "list", title: t(`lists.${list}`), list };
  if (project) return { kind: "project", title: splitProjectName(project.name).label, project };
  return { kind: "list", title: t("lists.all"), list: "all" };
};
