import { useId, useState, type KeyboardEvent } from "react";

import { useAppDispatch } from "@/app/hooks";
import ProjectPicker from "@/features/projects/ui/ProjectPicker/ProjectPicker";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { formatDateTime } from "@/shared/lib/date";
import Checkbox from "@/shared/ui/Checkbox/Checkbox";
import Icon from "@/shared/ui/Icon/Icon";
import IconButton from "@/shared/ui/IconButton/IconButton";

import { MAX_NOTES_LENGTH, MAX_TITLE_LENGTH, splitTitleTags, type Task } from "../../model/task";
import {
  taskImportanceToggled,
  taskNoted,
  taskProjectChanged,
  taskRenamed,
  taskRepeatChanged,
  taskScheduled,
  taskTagsChanged,
} from "../../model/tasksSlice";
import { duplicateTask, removeTasks, toggleTask } from "../../model/thunks";
import DuePicker from "../DuePicker/DuePicker";
import RepeatPicker from "../RepeatPicker/RepeatPicker";
import SubtaskList from "../SubtaskList/SubtaskList";
import TagPicker from "../TagPicker/TagPicker";

import styles from "./TaskDetails.module.scss";

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
}

// Every field of a task: title, date, repeat, project, subtasks, notes
const TaskDetails = ({ task, onClose }: TaskDetailsProps) => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t, intlLocale } = useI18n();
  const notesId = useId();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);

  // Keeps a valid title, or brings the old one back; typed #tags move to the tags
  const saveTitle = () => {
    const named = splitTitleTags(title);
    if (named.title) dispatch(taskRenamed(task.id, title));
    setTitle(named.title || task.title);
  };

  // Enter saves the title instead of adding a line
  const handleTitleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    saveTitle();
  };

  // Closes the details and copies the task
  const duplicate = () => {
    onClose();
    dispatch(duplicateTask(task.id));
  };

  // Closes the details and removes the task with undo
  const remove = () => {
    onClose();
    dispatch(removeTasks([task.id]));
  };

  const timestamps = [
    { key: "details.created", value: task.createdAt },
    { key: "details.updated", value: task.updatedAt === task.createdAt ? null : task.updatedAt },
    { key: "details.completedAt", value: task.completedAt },
  ] as const;

  return (
    <div className={styles.form}>
      <h2 className="visually-hidden">{t("details.title")}</h2>
      <div className={styles.head}>
        <Checkbox
          className={styles.toggle}
          checked={task.completed}
          aria-label={t("details.completed")}
          onChange={() => dispatch(toggleTask(task.id, today))}
        />
        <textarea
          className={styles.title}
          value={title}
          rows={1}
          maxLength={MAX_TITLE_LENGTH}
          aria-label={t("details.titleLabel")}
          enterKeyHint="done"
          data-completed={task.completed || undefined}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={saveTitle}
          onKeyDown={handleTitleKeyDown}
        />
        <IconButton icon="xmark" label={t("details.close")} variant="ghost" size="small" onClick={onClose} />
      </div>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.toggleButton}
          aria-pressed={task.important}
          onClick={() => dispatch(taskImportanceToggled(task.id))}
        >
          <Icon name="star" filled={task.important} />
          {t("details.important")}
        </button>
        <DuePicker
          value={task.dueDate}
          onChange={(dueDate) => dispatch(taskScheduled(task.id, dueDate))}
          variant="chip"
          label={t("details.dueDate")}
        />
        <RepeatPicker value={task.repeat} onChange={(repeat) => dispatch(taskRepeatChanged(task.id, repeat))} />
        <ProjectPicker
          value={task.projectId}
          onChange={(projectId) => dispatch(taskProjectChanged(task.id, projectId))}
        />
        <TagPicker value={task.tags} onChange={(tags) => dispatch(taskTagsChanged(task.id, tags))} />
      </div>

      <SubtaskList task={task} />

      <div className={styles.notes}>
        <label className={styles.label} htmlFor={notesId}>
          <Icon name="notes" />
          {t("details.notes")}
        </label>
        <textarea
          id={notesId}
          className={styles.textarea}
          value={notes}
          maxLength={MAX_NOTES_LENGTH}
          rows={5}
          placeholder={t("details.notesPlaceholder")}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={() => dispatch(taskNoted(task.id, notes))}
        />
        <p className={styles.counter} aria-hidden="true">
          {t("details.notesCounter", { count: notes.length, max: MAX_NOTES_LENGTH })}
        </p>
      </div>

      <ul className={styles.timestamps}>
        {timestamps.map(({ key, value }) =>
          value === null ? null : <li key={key}>{t(key, { date: formatDateTime(value, intlLocale) })}</li>,
        )}
      </ul>

      <div className={styles.footer}>
        <button type="button" className={styles.footerButton} onClick={duplicate}>
          <Icon name="copy" />
          <span className={styles.footerLabel}>{t("details.duplicate")}</span>
        </button>
        <button type="button" className={styles.footerButton} data-tone="danger" onClick={remove}>
          <Icon name="trash" />
          <span className={styles.footerLabel}>{t("details.delete")}</span>
        </button>
      </div>
    </div>
  );
};

export default TaskDetails;
