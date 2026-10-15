import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { startTransition, useEffect, useId, useMemo, useState, type ReactNode } from "react";

import Icon from "@/shared/ui/Icon/Icon";

import type { Task } from "../../model/task";
import TaskItem from "../TaskItem/TaskItem";

import styles from "./TaskSection.module.scss";

const FIRST_CHUNK = 120;

interface TaskSectionProps {
  id: string;
  title: string;
  tasks: readonly Task[];
  sortable: boolean;
  coarse: boolean;
  viewProjectId: string | null;
  tone?: "overdue";
  hideHeader?: boolean;
  hideDueDate?: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  action?: ReactNode;
}

// A titled group of tasks that renders long lists in two passes
const TaskSection = ({
  id,
  title,
  tasks,
  sortable,
  coarse,
  viewProjectId,
  tone,
  hideHeader = false,
  hideDueDate = false,
  collapsed = false,
  onToggleCollapsed,
  action,
}: TaskSectionProps) => {
  const headingId = useId();
  const listId = useId();
  const [limit, setLimit] = useState(FIRST_CHUNK);
  const idsKey = tasks.map((task) => task.id).join("\n");
  const ids = useMemo(() => (idsKey === "" ? [] : idsKey.split("\n")), [idsKey]);
  const shown = tasks.length > limit ? tasks.slice(0, limit) : tasks;
  const count = <span className={styles.count}>{tasks.length}</span>;

  // Renders the rest of a long list right after the first paint
  useEffect(() => {
    if (tasks.length <= limit) return;
    const timer = setTimeout(() => startTransition(() => setLimit(Number.POSITIVE_INFINITY)));
    return () => clearTimeout(timer);
  }, [tasks.length, limit]);

  return (
    <section className={styles.section} aria-labelledby={headingId}>
      <div className={hideHeader ? "visually-hidden" : styles.header} data-tone={tone}>
        <h2 id={headingId} className={styles.title}>
          {onToggleCollapsed ? (
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={!collapsed}
              aria-controls={listId}
              onClick={onToggleCollapsed}
            >
              <Icon name="chevronDown" className={styles.chevron} />
              {title}
              {count}
            </button>
          ) : (
            <>
              {title}
              {count}
            </>
          )}
        </h2>
        {action}
      </div>
      <SortableContext id={id} items={ids} strategy={verticalListSortingStrategy}>
        <ul id={listId} className={styles.list} hidden={collapsed}>
          {collapsed
            ? null
            : shown.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  sortable={sortable}
                  coarse={coarse}
                  viewProjectId={viewProjectId}
                  hideDueDate={hideDueDate}
                  previousId={tasks[index - 1]?.id ?? null}
                  nextId={tasks[index + 1]?.id ?? null}
                />
              ))}
        </ul>
      </SortableContext>
    </section>
  );
};

export default TaskSection;
