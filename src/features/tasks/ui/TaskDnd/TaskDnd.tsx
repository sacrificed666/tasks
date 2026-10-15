import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useState, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import Icon from "@/shared/ui/Icon/Icon";

import { selectTaskById } from "../../model/selectors";
import { stripTags } from "../../model/task";
import { taskMoved } from "../../model/tasksSlice";
import { dropTask } from "../../model/thunks";
import { collisions, createAnnouncements, resolveDrop } from "./dnd";

import styles from "./TaskDnd.module.scss";

interface TaskDndProps {
  children: ReactNode;
}

// Drag and drop for tasks: reordering and dropping on lists or projects
const TaskDnd = ({ children }: TaskDndProps) => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t } = useI18n();
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = useAppSelector((state) => (activeId === null ? undefined : selectTaskById(state, activeId)));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Marks the page while a task is dragged
  const handleDragStart = ({ active: dragged }: DragStartEvent) => {
    document.documentElement.dataset.dragging = "";
    setActiveId(String(dragged.id));
  };

  // Clears the dragging state
  const finishDrag = () => {
    delete document.documentElement.dataset.dragging;
    setActiveId(null);
  };

  // Moves the task to a list or project, or to its new place
  const handleDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    finishDrag();
    const result = resolveDrop(dragged, over);
    if (result?.type === "target") dispatch(dropTask(result.id, result.target, today));
    if (result?.type === "reorder") dispatch(taskMoved({ activeId: result.activeId, overId: result.overId }));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisions}
      accessibility={{
        announcements: createAnnouncements(t),
        screenReaderInstructions: { draggable: t("dnd.instructions") },
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={finishDrag}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {active ? (
          <div className={styles.frame}>
            <div className={styles.preview}>
              <span className={styles.title}>{stripTags(active.title) || active.title}</span>
              <Icon name="grip" className={styles.grip} />
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskDnd;
