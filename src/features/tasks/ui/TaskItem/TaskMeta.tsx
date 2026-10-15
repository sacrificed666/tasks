import { useAppDispatch } from "@/app/hooks";
import { projectView } from "@/features/lists/model/lists";
import { listChanged, queryChanged } from "@/features/lists/model/viewSlice";
import { splitProjectName, type Project } from "@/features/projects/model/project";
import ProjectIcon from "@/features/projects/ui/ProjectIcon/ProjectIcon";
import { useI18n } from "@/shared/i18n/useI18n";
import { cx } from "@/shared/lib/cx";
import { describeDueDate } from "@/shared/lib/date";
import Icon from "@/shared/ui/Icon/Icon";

import { subtaskProgress } from "../../model/subtasks";
import type { Task } from "../../model/task";

import styles from "./TaskItem.module.scss";

interface TaskMetaProps {
  task: Task;
  today: string;
  hideDueDate: boolean;
  project: Project | undefined;
}

// The chips under a title: due date, repeat, checklist, notes, project and tags
const TaskMeta = ({ task, today, hideDueDate, project }: TaskMetaProps) => {
  const dispatch = useAppDispatch();
  const { t, intlLocale } = useI18n();
  const due = task.dueDate && !hideDueDate ? describeDueDate(task.dueDate, today, intlLocale) : null;
  const checklist = subtaskProgress(task.subtasks);
  if (!due && !task.repeat && task.tags.length === 0 && !task.notes && checklist.total === 0 && !project) return null;

  return (
    <div className={styles.meta}>
      {due ? (
        <span className={styles.chip} data-tone={task.completed ? undefined : due.tone}>
          <Icon name="calendar" className={styles.chipIcon} />
          <time dateTime={task.dueDate ?? undefined}>{due.label}</time>
        </span>
      ) : null}
      {task.repeat ? (
        <span className={styles.chip} title={t("repeat.chip", { rule: t(`repeat.${task.repeat}`) })}>
          <Icon name="repeat" className={styles.chipIcon} />
          <span className="visually-hidden">{t("repeat.chip", { rule: t(`repeat.${task.repeat}`) })}</span>
        </span>
      ) : null}
      {checklist.total > 0 ? (
        <span
          className={styles.chip}
          data-tone={checklist.done === checklist.total ? "done" : undefined}
          title={t("task.subtasks", checklist)}
        >
          <Icon name="checkAll" className={styles.chipIcon} />
          <span aria-hidden="true">
            {checklist.done}/{checklist.total}
          </span>
          <span className="visually-hidden">{t("task.subtasks", checklist)}</span>
        </span>
      ) : null}
      {task.notes ? (
        <span className={styles.chip} title={t("task.notes")}>
          <Icon name="notes" className={styles.chipIcon} />
          <span className="visually-hidden">{t("task.notes")}</span>
        </span>
      ) : null}
      {project ? (
        <button
          type="button"
          className={cx(styles.chip, styles.project)}
          data-project-color={project.color}
          aria-label={t("project.show", { name: splitProjectName(project.name).label })}
          title={splitProjectName(project.name).label}
          onClick={() => dispatch(listChanged(projectView(project.id)))}
        >
          <ProjectIcon name={project.name} color={project.color} size="small" className={styles.projectIcon} />
          <span className={styles.chipLabel}>{splitProjectName(project.name).label}</span>
        </button>
      ) : null}
      {task.tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={cx(styles.chip, styles.tag)}
          aria-label={t("task.tag", { tag })}
          title={tag}
          onClick={() => dispatch(queryChanged(tag))}
        >
          <span className={styles.chipLabel}>{tag}</span>
        </button>
      ))}
    </div>
  );
};

export default TaskMeta;
