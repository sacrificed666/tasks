import { useId, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { projectView } from "@/features/lists/model/lists";
import { selectList, selectSearching } from "@/features/lists/model/selectors";
import { listChanged, overlayOpened } from "@/features/lists/model/viewSlice";
import { selectProjectCounts } from "@/features/tasks/model/selectors";
import { useDropTarget } from "@/features/tasks/ui/TaskDnd/useDropTarget";
import { useI18n } from "@/shared/i18n/useI18n";
import IconButton from "@/shared/ui/IconButton/IconButton";

import { splitProjectName, type Project } from "../../model/project";
import { projectMoved } from "../../model/projectsSlice";
import { selectProjects } from "../../model/selectors";
import ProjectIcon from "../ProjectIcon/ProjectIcon";

import styles from "./ProjectNav.module.scss";

// The element id of a project in the sidebar
const projectNavItemId = (projectId: string) => `project-nav-${projectId}`;

interface ProjectNavItemProps {
  project: Project;
  count: number;
  current: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

// One project with its count, and a drop target for tasks
const ProjectNavItem = ({ project, count, current, onSelect, onKeyDown }: ProjectNavItemProps) => {
  const { t } = useI18n();
  const { label } = splitProjectName(project.name);
  const [dropRef, dropActive] = useDropTarget(projectView(project.id), label);

  return (
    <li>
      <button
        ref={dropRef}
        id={projectNavItemId(project.id)}
        type="button"
        className={styles.item}
        data-project-color={project.color}
        data-drop-active={dropActive ? "" : undefined}
        aria-current={current ? "page" : undefined}
        aria-label={t("lists.counter", { label, count })}
        onClick={onSelect}
        onKeyDown={onKeyDown}
      >
        <ProjectIcon name={project.name} color={project.color} />
        <span className={styles.label}>{label}</span>{" "}
        {count > 0 ? (
          <span className={styles.count} aria-hidden="true">
            {count}
          </span>
        ) : null}
      </button>
    </li>
  );
};

interface ProjectNavProps {
  onNavigate?: () => void;
}

// Projects in the sidebar; Alt with an arrow key reorders them
const ProjectNav = ({ onNavigate }: ProjectNavProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const headingId = useId();
  const projects = useAppSelector(selectProjects);
  const counts = useAppSelector(selectProjectCounts);
  const list = useAppSelector(selectList);
  const searching = useAppSelector(selectSearching);

  // Alt with an arrow key moves a project up or down and keeps the focus
  const reorder = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    const project = projects[index];
    const target = projects[index + (event.key === "ArrowUp" ? -1 : 1)];
    if (!project || !target) return;
    event.preventDefault();
    flushSync(() => dispatch(projectMoved({ activeId: project.id, overId: target.id })));
    document.getElementById(projectNavItemId(project.id))?.focus();
  };

  return (
    <nav className={styles.nav} aria-labelledby={headingId}>
      <div className={styles.header}>
        <h2 id={headingId} className={styles.heading}>
          {t("projects.title")}
        </h2>
        <IconButton
          icon="plus"
          label={t("projects.new")}
          variant="ghost"
          size="small"
          className={styles.add}
          onClick={() => dispatch(overlayOpened({ kind: "project", projectId: null }))}
        />
      </div>
      {projects.length === 0 ? (
        <p className={styles.hint}>{t("projects.hint")}</p>
      ) : (
        <ul className={styles.list}>
          {projects.map((project, index) => (
            <ProjectNavItem
              key={project.id}
              project={project}
              count={counts.get(project.id) ?? 0}
              current={list === projectView(project.id) && !searching}
              onSelect={() => {
                dispatch(listChanged(projectView(project.id)));
                onNavigate?.();
              }}
              onKeyDown={(event) => reorder(event, index)}
            />
          ))}
        </ul>
      )}
    </nav>
  );
};

export default ProjectNav;
