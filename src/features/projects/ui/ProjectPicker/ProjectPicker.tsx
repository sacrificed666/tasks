import { useState } from "react";
import { flushSync } from "react-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { overlayOpened } from "@/features/lists/model/viewSlice";
import { useI18n } from "@/shared/i18n/useI18n";
import { cx } from "@/shared/lib/cx";
import Icon from "@/shared/ui/Icon/Icon";
import Popover from "@/shared/ui/Popover/Popover";
import { usePopover } from "@/shared/ui/Popover/usePopover";

import { splitProjectName } from "../../model/project";
import { selectProjects } from "../../model/selectors";
import ProjectIcon from "../ProjectIcon/ProjectIcon";

import styles from "./ProjectPicker.module.scss";

interface ProjectPickerProps {
  value: string | null;
  onChange: (projectId: string | null) => void;
  detected?: boolean;
  hideEmptyLabel?: boolean;
  className?: string;
}

// A chip that opens the list of projects for a task
const ProjectPicker = ({
  value,
  onChange,
  detected = false,
  hideEmptyLabel = false,
  className,
}: ProjectPickerProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const projects = useAppSelector(selectProjects);
  const popover = usePopover();
  const [open, setOpen] = useState(false);
  const project = projects.find((entry) => entry.id === value);
  const label = project ? splitProjectName(project.name).label : t("project.heading");

  // Renders the options before the popover shows
  const handleToggle = (next: boolean) => {
    if (next) flushSync(() => setOpen(true));
    else setOpen(false);
  };

  // Applies a project and closes the list
  const choose = (projectId: string | null) => {
    popover.close();
    onChange(projectId);
  };

  // Opens the dialog for a new project
  const createNew = () => {
    popover.close();
    dispatch(overlayOpened({ kind: "project", projectId: null }));
  };

  return (
    <>
      <button
        type="button"
        className={cx(styles.chip, className)}
        data-active={project ? "" : undefined}
        data-detected={detected ? "" : undefined}
        data-project-color={project?.color}
        aria-label={project ? t("project.chip", { name: label }) : label}
        title={detected ? t("composer.detected") : undefined}
        {...popover.triggerProps}
      >
        {project ? (
          <ProjectIcon name={project.name} color={project.color} size="small" />
        ) : (
          <Icon name="folder" className={styles.icon} />
        )}
        {project || !hideEmptyLabel ? <span className={styles.label}>{label}</span> : null}
      </button>
      <Popover
        id={popover.id}
        popoverRef={popover.ref}
        anchorName={popover.anchorName}
        label={t("project.heading")}
        className={styles.panel}
        onToggle={handleToggle}
      >
        {open ? (
          <>
            <p className={styles.heading}>{t("project.heading")}</p>
            <button type="button" className={styles.option} aria-pressed={value === null} onClick={() => choose(null)}>
              <Icon name="folder" className={styles.optionIcon} />
              <span className={styles.optionLabel}>{t("project.none")}</span>
              <Icon name="check" className={styles.check} />
            </button>
            {projects.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={styles.option}
                aria-pressed={entry.id === value}
                onClick={() => choose(entry.id)}
              >
                <ProjectIcon name={entry.name} color={entry.color} size="small" />
                <span className={styles.optionLabel}>{splitProjectName(entry.name).label}</span>
                <Icon name="check" className={styles.check} />
              </button>
            ))}
            <hr className={styles.separator} />
            <button type="button" className={styles.option} onClick={createNew}>
              <Icon name="plus" className={styles.optionIcon} />
              <span className={styles.optionLabel}>{t("projects.new")}</span>
            </button>
          </>
        ) : null}
      </Popover>
    </>
  );
};

export default ProjectPicker;
