import { useRef } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import ProjectIcon from "@/features/projects/ui/ProjectIcon/ProjectIcon";
import { selectListCounts } from "@/features/tasks/model/selectors";
import { useRefraction } from "@/shared/hooks/useRefraction";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { tap } from "@/shared/lib/haptics";
import Icon from "@/shared/ui/Icon/Icon";

import { LIST_ICONS } from "../../model/listIcons";
import type { ListId } from "../../model/lists";
import { selectCurrentProject, selectList, selectOverlayKind, selectSearching } from "../../model/selectors";
import { listChanged, overlayOpened } from "../../model/viewSlice";

import styles from "./TabBar.module.scss";

const TABS = ["all", "today", "upcoming", "important"] as const satisfies readonly ListId[];

// Tab bar with the main lists and the lists sheet on phones
const TabBar = () => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t } = useI18n();
  const list = useAppSelector(selectList);
  const searching = useAppSelector(selectSearching);
  const project = useAppSelector(selectCurrentProject);
  const browsing = useAppSelector((state) => selectOverlayKind(state) === "lists");
  const counts = useAppSelector((state) => selectListCounts(state, today));
  const barRef = useRef<HTMLElement>(null);
  const tabIndex = (TABS as readonly string[]).indexOf(list);
  const index = browsing || tabIndex === -1 ? TABS.length : tabIndex;

  useRefraction(barRef, { bezel: 22, scale: 44 });

  // Opens a list with a short vibration
  const select = (id: ListId) => {
    tap();
    dispatch(listChanged(id));
  };

  // Opens the sheet with every list, project and tag
  const browse = () => {
    tap();
    dispatch(overlayOpened({ kind: "lists" }));
  };

  return (
    <nav
      ref={barRef}
      className={styles.bar}
      aria-label={t("lists.nav")}
      style={{ "--index": index, "--count": TABS.length + 1 }}
      data-idle={searching && !browsing ? "" : undefined}
      data-glass-light=""
    >
      <span className={styles.indicator} aria-hidden="true" />
      {TABS.map((id) => (
        <button
          key={id}
          type="button"
          className={styles.tab}
          data-tone={id}
          aria-current={id === list && !browsing && !searching ? "page" : undefined}
          aria-label={t("lists.counter", { label: t(`lists.${id}.short`), count: counts[id] })}
          onClick={() => select(id)}
        >
          <span className={styles.label} aria-hidden="true">
            {t(`lists.${id}.short`)}
          </span>{" "}
          <span className={styles.icon}>
            <Icon name={LIST_ICONS[id]} filled={id === "important" && id === list} />
            {id === "today" && counts.today > 0 ? (
              <span className={styles.badge} data-alert={counts.overdue > 0 ? "" : undefined} aria-hidden="true">
                {counts.today}
              </span>
            ) : null}
          </span>
        </button>
      ))}
      <button
        type="button"
        className={styles.tab}
        data-tone={list === "completed" ? "completed" : "lists"}
        aria-current={index === TABS.length ? "page" : undefined}
        aria-haspopup="dialog"
        aria-label={t("lists.browse")}
        onClick={browse}
      >
        <span className={styles.icon}>
          {project && !browsing ? (
            <ProjectIcon name={project.name} color={project.color} size="small" />
          ) : (
            <Icon name={list === "completed" && !browsing ? "circleCheck" : "squares"} />
          )}
        </span>
        <span className={styles.label} aria-hidden="true">
          {t("lists.browse")}
        </span>
      </button>
    </nav>
  );
};

export default TabBar;
