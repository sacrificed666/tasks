import { useRef, useState, type ReactNode } from "react";

import { useAppSelector } from "@/app/hooks";
import { splitProjectName } from "@/features/projects/model/project";
import { selectProjects } from "@/features/projects/model/selectors";
import ProjectIcon from "@/features/projects/ui/ProjectIcon/ProjectIcon";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { useWeekStart } from "@/shared/i18n/useWeekStart";
import { cx } from "@/shared/lib/cx";
import { describeDueDate, formatWeekdayShort } from "@/shared/lib/date";
import Calendar from "@/shared/ui/Calendar/Calendar";
import ContextMenu, { type MenuPoint } from "@/shared/ui/ContextMenu/ContextMenu";
import Icon from "@/shared/ui/Icon/Icon";
import type { IconName } from "@/shared/ui/Icon/icons";

import { selectDueDateCounts } from "../../model/selectors";
import type { Task } from "../../model/task";
import { QUICK_DATES } from "../DuePicker/DuePicker";

import styles from "./TaskMenu.module.scss";

export interface TaskMenuActions {
  toggle: () => void;
  toggleImportant: () => void;
  schedule: (dueDate: string | null) => void;
  moveToProject: (projectId: string | null) => void;
  rename: () => void;
  openDetails: () => void;
  duplicate: () => void;
  remove: () => void;
}

interface TaskMenuProps {
  task: Task;
  point: MenuPoint;
  touch: boolean;
  actions: TaskMenuActions;
  onClose: () => void;
}

type Page = "main" | "date" | "project";

interface ItemProps {
  icon: IconName;
  label: string;
  tone?: "danger";
  submenu?: boolean;
  onSelect: () => void;
}

// A menu action, or an entry that opens a submenu
const Item = ({ icon, label, tone, submenu = false, onSelect }: ItemProps) => (
  <button
    type="button"
    role="menuitem"
    aria-haspopup={submenu ? "menu" : undefined}
    className={styles.item}
    data-tone={tone}
    onClick={onSelect}
  >
    <Icon name={icon} className={styles.icon} />
    <span className={styles.label}>{label}</span>
    {submenu ? <Icon name="chevronRight" className={styles.chevron} /> : null}
  </button>
);

interface ChoiceProps {
  checked: boolean;
  icon: ReactNode;
  label: string;
  onSelect: () => void;
}

// A radio entry of a submenu
const Choice = ({ checked, icon, label, onSelect }: ChoiceProps) => (
  <button type="button" role="menuitemradio" aria-checked={checked} className={styles.item} onClick={onSelect}>
    {icon}
    <span className={styles.label}>{label}</span>
    {checked ? <Icon name="check" className={styles.check} /> : null}
  </button>
);

// Context menu of a task with submenus for date, repeat and project
const TaskMenu = ({ task, point, touch, actions, onClose }: TaskMenuProps) => {
  const today = useToday();
  const { t, intlLocale } = useI18n();
  const weekStart = useWeekStart();
  const projects = useAppSelector(selectProjects);
  const marks = useAppSelector(selectDueDateCounts);
  const [page, setPage] = useState<Page>("main");
  const menuRef = useRef<HTMLDivElement>(null);

  // An action that closes the menu first
  const run = (action: () => void) => () => {
    menuRef.current?.hidePopover();
    action();
  };

  // The entry that returns to the first page of the menu
  const back = (
    <button type="button" role="menuitem" className={styles.back} onClick={() => setPage("main")}>
      <Icon name="chevronLeft" className={styles.icon} />
      {t("menu.back")}
    </button>
  );

  let content: ReactNode;

  if (page === "date") {
    content = (
      <div className={styles.page}>
        {back}
        <Calendar
          value={task.dueDate}
          today={today}
          locale={intlLocale}
          weekStart={weekStart}
          marks={marks}
          labels={{
            previous: t("calendar.previous"),
            next: t("calendar.next"),
            describe: (count) => t("calendar.tasks", { count }),
          }}
          onSelect={(date) => run(() => actions.schedule(date))()}
        />
      </div>
    );
  } else if (page === "project") {
    content = (
      <div className={styles.page}>
        {back}
        <Choice
          checked={task.projectId === null}
          icon={<Icon name="folder" className={styles.icon} />}
          label={t("project.none")}
          onSelect={run(() => actions.moveToProject(null))}
        />
        {projects.map((project) => (
          <Choice
            key={project.id}
            checked={task.projectId === project.id}
            icon={<ProjectIcon name={project.name} color={project.color} size="small" className={styles.icon} />}
            label={splitProjectName(project.name).label}
            onSelect={run(() => actions.moveToProject(project.id))}
          />
        ))}
      </div>
    );
  } else {
    content = (
      <>
        <p className={styles.caption}>
          {t("due.heading")}
          {task.dueDate ? <span>{describeDueDate(task.dueDate, today, intlLocale).label}</span> : null}
        </p>
        <div className={styles.dates}>
          {QUICK_DATES.map((option) => {
            const date = option.resolve(today);
            return (
              <button
                key={option.key}
                type="button"
                role="menuitemradio"
                aria-checked={task.dueDate === date}
                aria-label={`${t(option.key)}, ${formatWeekdayShort(date, intlLocale)}`}
                title={t(option.key)}
                className={styles.date}
                onClick={run(() => actions.schedule(date))}
              >
                <Icon name={option.icon} />
              </button>
            );
          })}
          <button
            type="button"
            role="menuitem"
            aria-haspopup="menu"
            aria-label={t("due.pick")}
            title={t("due.pick")}
            className={cx(styles.date, styles.pick)}
            onClick={() => setPage("date")}
          >
            <Icon name="calendar" />
          </button>
        </div>
        <hr className={styles.separator} />
        <Item
          icon={task.completed ? "rotate" : "check"}
          label={task.completed ? t("menu.reopen") : t("menu.complete")}
          onSelect={run(actions.toggle)}
        />
        <Item
          icon="star"
          label={task.important ? t("menu.unstar") : t("menu.star")}
          onSelect={run(actions.toggleImportant)}
        />
        {task.dueDate ? (
          <Item icon="xmark" label={t("due.remove")} onSelect={run(() => actions.schedule(null))} />
        ) : null}
        <Item icon="folder" label={t("menu.moveTo")} submenu onSelect={() => setPage("project")} />
        <hr className={styles.separator} />
        <Item icon="pencil" label={t("menu.rename")} onSelect={run(actions.rename)} />
        <Item icon="info" label={t("menu.details")} onSelect={run(actions.openDetails)} />
        <Item icon="copy" label={t("details.duplicate")} onSelect={run(actions.duplicate)} />
        <hr className={styles.separator} />
        <Item icon="trash" label={t("details.delete")} tone="danger" onSelect={run(actions.remove)} />
      </>
    );
  }

  return (
    <ContextMenu
      menuRef={menuRef}
      point={point}
      touch={touch}
      page={page}
      onBack={page === "main" ? undefined : () => setPage("main")}
      label={t("menu.label", { title: task.title })}
      onClose={onClose}
      className={styles.menu}
    >
      {content}
    </ContextMenu>
  );
};

export default TaskMenu;
