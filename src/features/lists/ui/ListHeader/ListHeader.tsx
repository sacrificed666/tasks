import { useAppDispatch, useAppSelector } from "@/app/hooks";
import ProjectIcon from "@/features/projects/ui/ProjectIcon/ProjectIcon";
import { selectListProgress, selectVisibleTasks } from "@/features/tasks/model/selectors";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { formatHeadline } from "@/shared/lib/date";
import Icon from "@/shared/ui/Icon/Icon";
import IconButton from "@/shared/ui/IconButton/IconButton";
import ProgressBar from "@/shared/ui/ProgressBar/ProgressBar";

import { LIST_ICONS } from "../../model/listIcons";
import { useViewInfo } from "../../model/useViewInfo";
import { overlayOpened, queryChanged } from "../../model/viewSlice";
import SortMenu from "../SortMenu/SortMenu";

import styles from "./ListHeader.module.scss";

export const LIST_TITLE_ID = "list-title";

// Title of the list, project or search with its progress
const ListHeader = () => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t, intlLocale } = useI18n();
  const view = useViewInfo();
  const { done, total } = useAppSelector((state) => selectListProgress(state, today));
  const results = useAppSelector((state) => {
    const { active, completed } = selectVisibleTasks(state, today);
    return active.length + completed.length;
  });
  const showProgress =
    view.kind !== "search" && total > 0 && !(view.kind === "list" && ["completed", "upcoming"].includes(view.list));

  return (
    <div className={styles.header}>
      <div className={styles.row}>
        {view.kind === "project" ? (
          <ProjectIcon name={view.project.name} color={view.project.color} size="large" />
        ) : (
          <span className={styles.icon} data-tone={view.kind === "search" ? "search" : view.list}>
            <Icon
              name={view.kind === "search" ? "search" : LIST_ICONS[view.list]}
              filled={view.kind === "list" && view.list === "important"}
            />
          </span>
        )}
        <div className={styles.headings}>
          <h1 id={LIST_TITLE_ID} className={styles.title}>
            {view.title}
          </h1>
          <p className={styles.subtitle}>
            {view.kind === "search" ? (
              <span aria-hidden="true">{t("search.results", { count: results, query: view.query })}</span>
            ) : (
              <time dateTime={today}>{formatHeadline(today, intlLocale)}</time>
            )}
            {showProgress ? <span className={styles.progress}>{t("listHeader.progress", { done, total })}</span> : null}
          </p>
        </div>
        <div className={styles.tools}>
          {view.kind === "project" ? (
            <IconButton
              icon="pencil"
              label={t("project.edit")}
              onClick={() => dispatch(overlayOpened({ kind: "project", projectId: view.project.id }))}
            />
          ) : null}
          {view.kind === "search" ? (
            <IconButton icon="xmark" label={t("search.clear")} onClick={() => dispatch(queryChanged(""))} />
          ) : (
            <SortMenu />
          )}
        </div>
      </div>
      <output className="visually-hidden" aria-live="polite">
        {view.kind === "search" ? t("search.results", { count: results, query: view.query }) : ""}
      </output>
      {showProgress ? (
        <ProgressBar value={done} max={total} label={t("listHeader.progressLabel", { list: view.title })} />
      ) : null}
    </div>
  );
};

export default ListHeader;
