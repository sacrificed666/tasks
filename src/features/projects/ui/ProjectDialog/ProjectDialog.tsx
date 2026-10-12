import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectOverlay } from "@/features/lists/model/selectors";
import { overlayClosed } from "@/features/lists/model/viewSlice";
import { selectTasks } from "@/features/tasks/model/selectors";
import { useI18n } from "@/shared/i18n/useI18n";
import Dialog from "@/shared/ui/Dialog/Dialog";
import Icon from "@/shared/ui/Icon/Icon";
import IconButton from "@/shared/ui/IconButton/IconButton";
import SwatchPicker from "@/shared/ui/SwatchPicker/SwatchPicker";

import {
  joinProjectName,
  MAX_PROJECT_NAME_LENGTH,
  normalizeProjectName,
  PROJECT_COLORS,
  splitProjectName,
  suggestProjectColor,
  type Project,
  type ProjectColor,
} from "../../model/project";
import { projectUpdated } from "../../model/projectsSlice";
import { selectProjectById, selectProjects } from "../../model/selectors";
import { createProject, deleteProject } from "../../model/thunks";
import EmojiPicker from "../EmojiPicker/EmojiPicker";

import styles from "./ProjectDialog.module.scss";

interface ProjectFormProps {
  project: Project | undefined;
  onClose: () => void;
}

// Emoji, name and colour of a new or edited project
const ProjectForm = ({ project, onClose }: ProjectFormProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const nameId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const projectCount = useAppSelector((state) => selectProjects(state).length);
  const taskCount = useAppSelector((state) =>
    project ? selectTasks(state).filter((task) => task.projectId === project.id).length : 0,
  );
  const [emoji, setEmoji] = useState(() => splitProjectName(project?.name ?? "").emoji);
  const [label, setLabel] = useState(() => splitProjectName(project?.name ?? "").label);
  const [color, setColor] = useState<ProjectColor>(project?.color ?? suggestProjectColor(projectCount));
  const [confirming, setConfirming] = useState(false);
  const valid = normalizeProjectName(label) !== "";

  // Focuses the name field when the dialog opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Saves the project, or creates it and opens it
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    const name = joinProjectName(emoji, label);
    if (project) dispatch(projectUpdated(project.id, { name, color }));
    else dispatch(createProject({ name, color }));
    onClose();
  };

  // Closes the dialog and deletes the project with undo
  const remove = () => {
    if (!project) return;
    onClose();
    dispatch(deleteProject(project.id));
  };

  const colorOptions = PROJECT_COLORS.map((value) => ({
    value,
    label: t(`project.color.${value}`),
    color: `var(--project-${value})`,
  }));

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.head}>
        <h2 className={styles.title}>{project ? t("project.edit") : t("projects.new")}</h2>
        <IconButton icon="xmark" label={t("project.cancel")} variant="ghost" size="small" onClick={onClose} />
      </div>

      <div className={styles.identity}>
        <EmojiPicker name={normalizeProjectName(label)} emoji={emoji} color={color} onChange={setEmoji} />
        <div className={styles.field}>
          <label className={styles.label} htmlFor={nameId}>
            {t("project.name")}
          </label>
          <input
            ref={inputRef}
            id={nameId}
            className={styles.input}
            value={label}
            maxLength={MAX_PROJECT_NAME_LENGTH + 10}
            placeholder={t("project.namePlaceholder")}
            autoComplete="off"
            enterKeyHint="done"
            aria-describedby={hintId}
            onChange={(event) => setLabel(event.target.value)}
          />
        </div>
      </div>
      <p id={hintId} className={styles.hint}>
        {t("project.nameHint")}
      </p>

      <p className={styles.label}>{t("project.color")}</p>
      <SwatchPicker
        name="project-color"
        label={t("project.color")}
        value={color}
        options={colorOptions}
        onChange={setColor}
      />

      {confirming && project ? (
        <div className={styles.confirm} role="alert">
          <p className={styles.warning}>
            <Icon name="alert" className={styles.warningIcon} />
            {taskCount > 0
              ? t("project.deleteWarning", { name: project.name, count: taskCount })
              : t("project.deleteWarningEmpty", { name: project.name })}
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setConfirming(false)}>
              {t("project.cancel")}
            </button>
            <button type="button" className={styles.danger} onClick={remove}>
              <Icon name="trash" />
              {t("project.deleteConfirm")}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {project ? (
            <button type="button" className={styles.remove} onClick={() => setConfirming(true)}>
              <Icon name="trash" />
              {t("project.delete")}
            </button>
          ) : null}
          <span className={styles.spacer} />
          <button type="button" className={styles.secondary} onClick={onClose}>
            {t("project.cancel")}
          </button>
          <button type="submit" className={styles.primary} disabled={!valid}>
            {project ? t("project.save") : t("project.create")}
          </button>
        </div>
      )}
    </form>
  );
};

// Dialog that creates or edits a project
const ProjectDialog = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const overlay = useAppSelector(selectOverlay);
  const projectId = overlay?.kind === "project" ? overlay.projectId : null;
  const project = useAppSelector((state) => (projectId === null ? undefined : selectProjectById(state, projectId)));
  const open = overlay?.kind === "project" && (projectId === null || project !== undefined);
  // Closes the dialog
  const close = () => dispatch(overlayClosed("project"));

  return (
    <Dialog
      open={open}
      label={project ? t("project.edit") : t("projects.new")}
      onClose={close}
      className={styles.dialog}
    >
      <ProjectForm key={projectId ?? "new"} project={project} onClose={close} />
    </Dialog>
  );
};

export default ProjectDialog;
