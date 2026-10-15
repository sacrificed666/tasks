import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  memo,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
} from "react";
import { flushSync } from "react-dom";

import { useAppDispatch, useAppSelector, useAppStore } from "@/app/hooks";
import { matchesView } from "@/features/lists/model/lists";
import { selectDetailsId, selectList, selectSearching } from "@/features/lists/model/selectors";
import { detailsOpened } from "@/features/lists/model/viewSlice";
import { selectProjectById } from "@/features/projects/model/selectors";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { celebrate } from "@/shared/lib/celebrate";
import { cx } from "@/shared/lib/cx";
import { tap } from "@/shared/lib/haptics";
import { prefersReducedMotion, waitForTransitions } from "@/shared/lib/motion";
import Checkbox from "@/shared/ui/Checkbox/Checkbox";
import type { MenuPoint } from "@/shared/ui/ContextMenu/ContextMenu";
import Icon from "@/shared/ui/Icon/Icon";
import IconButton from "@/shared/ui/IconButton/IconButton";

import { MAX_TITLE_LENGTH, type Task } from "../../model/task";
import {
  taskImportanceToggled,
  taskMoved,
  taskProjectChanged,
  taskRenamed,
  taskScheduled,
} from "../../model/tasksSlice";
import { duplicateTask, removeTasks, toggleTask } from "../../model/thunks";
import DuePicker from "../DuePicker/DuePicker";
import { COMPOSER_INPUT_ID, TOGGLE_SELECTOR, toggleId } from "../ids";
import TaskMenu, { type TaskMenuActions } from "../TaskMenu/TaskMenu";
import TaskMeta from "./TaskMeta";
import { anchorOf, useRowGestures } from "./useRowGestures";
import { useRowShortcuts } from "./useRowShortcuts";

import styles from "./TaskItem.module.scss";

const TOGGLE_DELAY = 420;

// Focuses the first of the given elements that exists
const focusFirst = (...ids: Array<string | null>) => {
  for (const id of ids) {
    const element = id === null ? null : document.getElementById(id);
    if (element) {
      element.focus();
      return;
    }
  }
};

// Keeps the title editor focused while its buttons are pressed
const keepEditorFocus = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

// The middle of an element, for the confetti
const centerOf = (element: Element | null) => {
  if (!element) return;
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
};

interface TaskItemProps {
  task: Task;
  previousId: string | null;
  nextId: string | null;
  sortable: boolean;
  coarse: boolean;
  viewProjectId: string | null;
  hideDueDate?: boolean;
}

// One task: check, title, chips, swipe actions, drag and context menu
const TaskItem = ({
  task,
  previousId,
  nextId,
  sortable,
  coarse,
  viewProjectId,
  hideDueDate = false,
}: TaskItemProps) => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t } = useI18n();
  const store = useAppStore();
  const selected = useAppSelector((state) => selectDetailsId(state) === task.id);
  const project = useAppSelector((state) =>
    task.projectId === null ? undefined : selectProjectById(state, task.projectId),
  );
  const itemRef = useRef<HTMLLIElement>(null);
  const editorRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLButtonElement>(null);
  const toggleTimer = useRef(0);
  const pendingCommit = useRef<(() => boolean) | null>(null);
  const [pendingToggle, setPendingToggle] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [menu, setMenu] = useState<{ point: MenuPoint; touch: boolean } | null>(null);

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { title: task.title },
    disabled: !sortable || editing || leaving,
  });

  const checked = pendingToggle ? !task.completed : task.completed;
  const neighborId = nextId ?? previousId;
  const shownProject = project?.id === viewProjectId ? undefined : project;

  // Finishes a pending check when the page or the row goes away
  useEffect(() => {
    // Runs a pending check right away
    const flushToggle = () => {
      const toggle = pendingCommit.current;
      pendingCommit.current = null;
      clearTimeout(toggleTimer.current);
      toggle?.();
    };
    window.addEventListener("pagehide", flushToggle);
    return () => {
      window.removeEventListener("pagehide", flushToggle);
      flushToggle();
    };
  }, []);

  // Focuses and selects the title when editing starts
  useEffect(() => {
    if (!editing) return;
    editorRef.current?.focus();
    editorRef.current?.select();
  }, [editing]);

  // Animates the row out, applies the change and keeps the focus nearby
  const leave = async (commit: () => void) => {
    const hadFocus = itemRef.current?.contains(document.activeElement) ?? false;

    if (!prefersReducedMotion()) {
      flushSync(() => setLeaving(true));
      await waitForTransitions(itemRef.current);
    }

    flushSync(commit);
    setLeaving(false);
    setPendingToggle(false);

    if (hadFocus) focusFirst(toggleId(task.id), neighborId === null ? null : toggleId(neighborId), COMPOSER_INPUT_ID);
  };

  // Animates the row out when a change moves it to another list
  const update = (next: Task, commit: () => void) => {
    const state = store.getState();
    if (selectSearching(state) || matchesView(next, selectList(state), today)) commit();
    else void leave(commit);
  };

  // Checks the task after the row has left, with confetti
  const commitToggle = () => {
    const origin = centerOf(document.getElementById(toggleId(task.id)));
    pendingCommit.current = () => dispatch(toggleTask(task.id, today));
    return leave(() => {
      const toggle = pendingCommit.current;
      pendingCommit.current = null;
      if (toggle?.()) celebrate(origin);
    });
  };

  // Checks after a short delay so a quick second tap can undo it
  const handleToggle = () => {
    if (leaving) return;
    clearTimeout(toggleTimer.current);
    tap();

    if (pendingToggle) {
      pendingCommit.current = null;
      setPendingToggle(false);
      return;
    }

    if (prefersReducedMotion()) {
      void commitToggle();
      return;
    }

    setPendingToggle(true);
    pendingCommit.current = () => dispatch(toggleTask(task.id, today));
    toggleTimer.current = window.setTimeout(() => void commitToggle(), TOGGLE_DELAY);
  };

  // Stars or unstars the task
  const toggleImportant = () => {
    if (leaving) return;
    update({ ...task, important: !task.important }, () => dispatch(taskImportanceToggled(task.id)));
  };

  // Sets or clears the due date
  const schedule = (dueDate: string | null) =>
    update({ ...task, dueDate }, () => dispatch(taskScheduled(task.id, dueDate)));

  // Removes the task after the row has left
  const handleDelete = () => {
    if (leaving) return;
    clearTimeout(toggleTimer.current);
    void leave(() => dispatch(removeTasks([task.id])));
  };

  // Edits the title in place
  const startEditing = () => {
    if (leaving) return;
    setDraft(task.title);
    setEditing(true);
  };

  // Saves or drops the new title and returns the focus
  const finishEditing = (save: boolean, restoreFocus: boolean) => {
    if (save) dispatch(taskRenamed(task.id, draft));
    flushSync(() => setEditing(false));
    if (restoreFocus) titleRef.current?.focus();
  };

  // Opens the task details
  const openDetails = () => dispatch(detailsOpened(task.id));

  // Opens the context menu at a point
  const openMenu = (point: MenuPoint, touch = false) => {
    if (editing || leaving) return;
    setMenu({ point, touch });
  };

  // Moves the task to a project or out of it
  const moveToProject = (projectId: string | null) =>
    update({ ...task, projectId }, () => dispatch(taskProjectChanged(task.id, projectId)));

  const menuActions: TaskMenuActions = {
    toggle: () => {
      clearTimeout(toggleTimer.current);
      setPendingToggle(false);
      void commitToggle();
    },
    toggleImportant,
    schedule,
    moveToProject,
    rename: startEditing,
    openDetails,
    duplicate: () => dispatch(duplicateTask(task.id)),
    remove: handleDelete,
  };

  // Opens the due date options of the row
  const openDuePicker = () => itemRef.current?.querySelector<HTMLButtonElement>("[data-due-trigger]")?.click();

  // Moves the focus to the next or previous task
  const focusSibling = (direction: 1 | -1) => {
    const toggles = Array.from(document.querySelectorAll<HTMLElement>(TOGGLE_SELECTOR));
    const index = toggles.findIndex((element) => element.id === toggleId(task.id));
    toggles[index + direction]?.focus();
  };

  // Moves the task next to a neighbour and keeps the focus
  const reorder = (targetId: string | null) => {
    if (!sortable || targetId === null) return;
    const focused = document.activeElement;
    flushSync(() => dispatch(taskMoved({ activeId: task.id, overId: targetId })));
    if (focused instanceof HTMLElement) focused.focus();
  };

  // Enter saves the title and Escape cancels
  const handleEditorKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== "Escape") return;
    event.preventDefault();
    finishEditing(event.key === "Enter", true);
  };

  // Saves the title when the focus leaves the row
  const handleEditorBlur = (event: FocusEvent<HTMLInputElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && itemRef.current?.contains(next)) return;
    finishEditing(true, false);
  };

  // Arrows, S, D, E, I, Delete and the menu key while the focus is in the row
  useRowShortcuts(itemRef, editing || leaving || isDragging, {
    menu: () => openMenu(anchorOf(titleRef.current ?? itemRef.current)),
    focus: focusSibling,
    move: (direction) => reorder(direction === -1 ? previousId : nextId),
    keys: {
      s: toggleImportant,
      d: openDuePicker,
      e: startEditing,
      i: openDetails,
      delete: handleDelete,
      backspace: handleDelete,
    },
  });

  // Swipes, the long press and the right click of the row
  const gestures = useRowGestures({
    itemRef,
    titleRef,
    disabled: editing || leaving,
    menuOpen: menu !== null,
    openMenu,
    onComplete: () => {
      clearTimeout(toggleTimer.current);
      void commitToggle();
    },
    onDelete: handleDelete,
  });

  return (
    <li ref={itemRef} className={styles.item} data-leaving={leaving || undefined} data-own-swipe="">
      <div className={styles.collapse}>
        <div className={styles.swipe} aria-hidden="true">
          <Icon name={task.completed ? "rotate" : "check"} className={styles.swipeIcon} />
          <Icon name="trash" className={styles.swipeIcon} />
        </div>
        <div
          ref={setNodeRef}
          className={styles.row}
          style={{ transform: CSS.Translate.toString(transform), transition }}
          data-completed={checked || undefined}
          data-dragging={isDragging || undefined}
          data-editing={editing || undefined}
          data-selected={selected || undefined}
          {...gestures}
        >
          <Checkbox
            id={toggleId(task.id)}
            className={styles.checkbox}
            checked={checked}
            onChange={handleToggle}
            aria-label={task.title}
            data-task-toggle=""
          />

          {editing ? (
            <input
              ref={editorRef}
              className={styles.editor}
              value={draft}
              maxLength={MAX_TITLE_LENGTH}
              enterKeyHint="done"
              aria-label={t("task.editor")}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              onBlur={handleEditorBlur}
            />
          ) : (
            <button
              ref={titleRef}
              type="button"
              className={styles.title}
              aria-label={coarse ? t("task.details", { title: task.title }) : t("task.edit", { title: task.title })}
              onClick={coarse ? openDetails : startEditing}
            >
              {task.title}
            </button>
          )}

          {editing ? null : <TaskMeta task={task} today={today} hideDueDate={hideDueDate} project={shownProject} />}

          <div className={styles.actions}>
            {editing ? (
              <>
                <IconButton
                  icon="check"
                  label={t("task.save")}
                  variant="accent"
                  size="small"
                  onMouseDown={keepEditorFocus}
                  onClick={() => finishEditing(true, true)}
                />
                <IconButton
                  icon="xmark"
                  label={t("task.cancel")}
                  variant="ghost"
                  size="small"
                  onMouseDown={keepEditorFocus}
                  onClick={() => finishEditing(false, true)}
                />
              </>
            ) : (
              <>
                <IconButton
                  icon="star"
                  iconFilled={task.important}
                  label={t("task.star", { title: task.title })}
                  variant="ghost"
                  size="small"
                  className={cx(styles.action, styles.star)}
                  aria-pressed={task.important}
                  onClick={toggleImportant}
                />
                <DuePicker
                  value={task.dueDate}
                  onChange={schedule}
                  variant="icon"
                  label={t("task.schedule", { title: task.title })}
                  className={cx(styles.action, styles.schedule)}
                />
                <IconButton
                  icon="info"
                  label={t("task.details", { title: task.title })}
                  variant="ghost"
                  size="small"
                  className={cx(styles.action, styles.info)}
                  onClick={openDetails}
                />
                <IconButton
                  icon="trash"
                  label={t("task.delete", { title: task.title })}
                  variant="danger"
                  size="small"
                  className={cx(styles.action, styles.delete)}
                  onClick={handleDelete}
                />
                {sortable ? (
                  <button
                    ref={setActivatorNodeRef}
                    type="button"
                    className={cx(styles.action, styles.handle)}
                    aria-label={t("task.reorder", { title: task.title })}
                    data-swipe-ignore=""
                    {...attributes}
                    {...listeners}
                  >
                    <Icon name="grip" />
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
      {menu ? (
        <TaskMenu
          task={task}
          point={menu.point}
          touch={menu.touch}
          actions={menuActions}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </li>
  );
};

export default memo(TaskItem);
