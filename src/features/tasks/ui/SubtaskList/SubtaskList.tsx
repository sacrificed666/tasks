import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { useAppDispatch } from "@/app/hooks";
import { useI18n } from "@/shared/i18n/useI18n";
import Checkbox from "@/shared/ui/Checkbox/Checkbox";
import Icon from "@/shared/ui/Icon/Icon";
import IconButton from "@/shared/ui/IconButton/IconButton";

import {
  MAX_SUBTASK_LENGTH,
  MAX_SUBTASKS,
  normalizeSubtaskTitle,
  subtaskProgress,
  type Subtask,
} from "../../model/subtasks";
import type { Task } from "../../model/task";
import { subtaskAdded, subtaskMoved, subtaskRemoved, subtaskRenamed, subtaskToggled } from "../../model/tasksSlice";

import styles from "./SubtaskList.module.scss";

// A subtask only moves up and down, and never past the ends of its list
const keepInList: Modifier = ({ transform, draggingNodeRect, containerNodeRect }) => {
  if (!draggingNodeRect || !containerNodeRect) return { ...transform, x: 0 };
  const top = containerNodeRect.top - draggingNodeRect.top;
  const bottom = containerNodeRect.bottom - draggingNodeRect.bottom;
  return { ...transform, x: 0, y: Math.min(Math.max(transform.y, top), bottom) };
};

const MODIFIERS = [keepInList];

// The panel scrolls only up and down while a subtask is dragged near its edge
const AUTO_SCROLL = { threshold: { x: 0, y: 0.15 } };

interface SubtaskRowProps {
  taskId: string;
  subtask: Subtask;
  index: number;
  count: number;
  inputRef: (node: HTMLInputElement | null) => void;
  onNext: () => void;
  onMove: (index: number) => void;
  onRemove: () => void;
}

// One subtask: checkbox, editable title, drag handle and delete button
const SubtaskRow = ({ taskId, subtask, index, count, inputRef, onNext, onMove, onRemove }: SubtaskRowProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const [title, setTitle] = useState(subtask.title);
  const { listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id,
  });

  // Keeps a renamed subtask, or removes it when the title is cleared
  const save = () => {
    if (normalizeSubtaskTitle(title)) dispatch(subtaskRenamed(taskId, subtask.id, title));
    else onRemove();
  };

  // Enter moves on, Backspace on empty removes, Alt and arrows reorder
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    const step = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
    if (event.key === "Enter") {
      event.preventDefault();
      save();
      onNext();
    } else if (event.key === "Backspace" && title === "") {
      event.preventDefault();
      onRemove();
    } else if (event.altKey && step !== 0 && index + step >= 0 && index + step < count) {
      event.preventDefault();
      save();
      onMove(index + step);
    }
  };

  return (
    <li
      ref={setNodeRef}
      className={styles.row}
      data-done={subtask.completed || undefined}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <Checkbox
        size="small"
        checked={subtask.completed}
        aria-label={subtask.title}
        onChange={() => dispatch(subtaskToggled(taskId, subtask.id))}
      />
      <input
        ref={inputRef}
        className={styles.input}
        value={title}
        maxLength={MAX_SUBTASK_LENGTH}
        aria-label={t("details.subtaskTitle", { index: index + 1 })}
        aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
        enterKeyHint="next"
        onChange={(event) => setTitle(event.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
      />
      <span ref={setActivatorNodeRef} className={styles.handle} aria-hidden="true" {...listeners}>
        <Icon name="grip" />
      </span>
      <IconButton
        className={styles.remove}
        icon="xmark"
        variant="ghost"
        size="small"
        label={t("details.subtaskRemove", { title: subtask.title })}
        onClick={onRemove}
      />
    </li>
  );
};

interface SubtaskListProps {
  task: Task;
}

// The checklist of a task: add, tick, rename, reorder and delete subtasks
const SubtaskList = ({ task }: SubtaskListProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const headingId = useId();
  const addRef = useRef<HTMLInputElement>(null);
  const rows = useRef(new Map<string, HTMLInputElement>());
  const [draft, setDraft] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const { subtasks } = task;
  const progress = subtaskProgress(subtasks);
  const full = subtasks.length >= MAX_SUBTASKS;

  // Focuses a subtask, or the add field, after the list updates
  const focus = (subtaskId: string | undefined) => {
    requestAnimationFrame(() => (subtaskId === undefined ? addRef.current : rows.current.get(subtaskId))?.focus());
  };

  // Adds a subtask and keeps the field ready for the next one
  const add = (event: FormEvent) => {
    event.preventDefault();
    if (full || !normalizeSubtaskTitle(draft)) return;
    dispatch(subtaskAdded(task.id, draft));
    setDraft("");
  };

  // Removes a subtask and focuses its neighbour
  const remove = (index: number) => {
    const subtask = subtasks[index];
    if (!subtask) return;
    dispatch(subtaskRemoved(task.id, subtask.id));
    focus((subtasks[index - 1] ?? subtasks[index + 1])?.id);
  };

  // Moves a dragged subtask to where it was dropped
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const index = subtasks.findIndex((subtask) => subtask.id === over?.id);
    if (index !== -1 && active.id !== over?.id) dispatch(subtaskMoved(task.id, String(active.id), index));
  };

  return (
    <section className={styles.subtasks} aria-labelledby={headingId}>
      <h3 className={styles.heading}>
        <Icon name="checkAll" />
        <span id={headingId}>{t("details.subtasks")}</span>
        {progress.total > 0 ? (
          <span className={styles.progress} data-done={progress.done === progress.total || undefined}>
            <span aria-hidden="true">
              {progress.done}/{progress.total}
            </span>
            <span className="visually-hidden">{t("task.subtasks", progress)}</span>
          </span>
        ) : null}
      </h3>
      {subtasks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={MODIFIERS}
          autoScroll={AUTO_SCROLL}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={subtasks.map((subtask) => subtask.id)} strategy={verticalListSortingStrategy}>
            <ul className={styles.list}>
              {subtasks.map((subtask, index) => (
                <SubtaskRow
                  key={`${subtask.id}:${subtask.title}`}
                  taskId={task.id}
                  subtask={subtask}
                  index={index}
                  count={subtasks.length}
                  inputRef={(node) => {
                    if (node) rows.current.set(subtask.id, node);
                    else rows.current.delete(subtask.id);
                  }}
                  onNext={() => focus(subtasks[index + 1]?.id)}
                  onMove={(target) => {
                    dispatch(subtaskMoved(task.id, subtask.id, target));
                    focus(subtask.id);
                  }}
                  onRemove={() => remove(index)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}
      <form className={styles.add} onSubmit={add}>
        <label className={styles.addField}>
          <Icon name="plus" className={styles.addIcon} />
          <input
            ref={addRef}
            className={styles.input}
            value={draft}
            maxLength={MAX_SUBTASK_LENGTH}
            disabled={full}
            placeholder={full ? t("details.subtasksLimit", { max: MAX_SUBTASKS }) : t("details.subtaskAdd")}
            aria-label={t("details.subtaskAdd")}
            enterKeyHint="enter"
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
      </form>
    </section>
  );
};

export default SubtaskList;
