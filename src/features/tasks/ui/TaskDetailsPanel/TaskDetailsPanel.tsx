import { useEffect, useEffectEvent, useRef } from "react";

import { useAppDispatch } from "@/app/hooks";
import { detailsClosed } from "@/features/lists/model/viewSlice";
import { useRefraction } from "@/shared/hooks/useRefraction";
import { useI18n } from "@/shared/i18n/useI18n";

import type { Task } from "../../model/task";
import { toggleId } from "../ids";
import TaskDetails from "../TaskDetails/TaskDetails";

import styles from "./TaskDetailsPanel.module.scss";

interface DetailsPanelProps {
  task: Task;
}

// Task details in the side panel on wide screens
const TaskDetailsPanel = ({ task }: DetailsPanelProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);

  useRefraction(ref, { bezel: 22, scale: 40 });

  // Returns the focus to the task's row and closes the panel
  const close = () => {
    const row = document.getElementById(toggleId(task.id));
    if (row) row.focus();
    else if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    dispatch(detailsClosed());
  };

  // Escape closes the panel unless a popover takes it
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    if (event.target instanceof Element && event.target.closest("[popover]")) return;
    event.preventDefault();
    close();
  });

  // Focuses the panel and listens for Escape inside it
  useEffect(() => {
    const panel = ref.current;
    if (!panel) return;
    panel.focus({ preventScroll: true });
    // Hands every key to the latest handler
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    panel.addEventListener("keydown", listener);
    return () => panel.removeEventListener("keydown", listener);
  }, []);

  return (
    <section ref={ref} className={styles.panel} aria-label={t("details.title")} tabIndex={-1} data-glass-light="">
      <div className={styles.body}>
        <TaskDetails task={task} onClose={close} />
      </div>
    </section>
  );
};

export default TaskDetailsPanel;
