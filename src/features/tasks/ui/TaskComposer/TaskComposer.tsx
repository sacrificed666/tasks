import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { projectIdOf, type ViewId } from "@/features/lists/model/lists";
import { splitProjectName } from "@/features/projects/model/project";
import { selectProjects } from "@/features/projects/model/selectors";
import ProjectPicker from "@/features/projects/ui/ProjectPicker/ProjectPicker";
import { useRefraction } from "@/shared/hooks/useRefraction";
import { useShortcut } from "@/shared/hooks/useShortcut";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { addDays } from "@/shared/lib/date";
import { isPlainKey } from "@/shared/lib/keyboard";
import Icon from "@/shared/ui/Icon/Icon";
import IconButton from "@/shared/ui/IconButton/IconButton";

import { parseQuickAdd } from "../../model/quickAdd";
import { MAX_TITLE_LENGTH, mergeTags, normalizeTitle } from "../../model/task";
import { addTask } from "../../model/thunks";
import DuePicker from "../DuePicker/DuePicker";
import { COMPOSER_INPUT_ID } from "../ids";
import TagPicker from "../TagPicker/TagPicker";

import styles from "./TaskComposer.module.scss";

interface TaskComposerProps {
  view: ViewId;
}

// Today in Today, tomorrow in Upcoming, otherwise no date
const defaultDueDate = (view: ViewId, today: string) => {
  if (view === "today") return today;
  if (view === "upcoming") return addDays(today, 1);
  return null;
};

// Quick add field that reads dates, repeats, tags and projects
const TaskComposer = ({ view }: TaskComposerProps) => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t } = useI18n();
  const projects = useAppSelector(selectProjects);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(() => defaultDueDate(view, today));
  const [important, setImportant] = useState(view === "important");
  const [project, setProject] = useState(() => projectIdOf(view));
  const [tags, setTags] = useState<string[]>([]);
  const [engaged, setEngaged] = useState(false);
  const expanded = engaged || title !== "";

  useRefraction(formRef, { bezel: 20, scale: 44 });

  // Collapses the composer on a click outside it
  useEffect(() => {
    if (!engaged) return;
    // Ignores clicks inside the composer
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && formRef.current?.contains(event.target)) return;
      setEngaged(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [engaged]);

  // Collapses the composer when the focus leaves it
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    // Only a focus outside the form counts
    const handleFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && !form.contains(next)) setEngaged(false);
    };
    form.addEventListener("focusout", handleFocusOut);
    return () => form.removeEventListener("focusout", handleFocusOut);
  }, []);

  useShortcut(isPlainKey("n"), (event) => {
    event.preventDefault();
    inputRef.current?.focus();
  });

  const parsed = parseQuickAdd(
    title,
    today,
    projects.map(({ id, name }) => ({ id, name, label: splitProjectName(name).label })),
  );
  const effectiveDueDate = parsed.dueDate ?? dueDate;
  const effectiveImportant = important || parsed.important;
  const effectiveProject = parsed.projectId ?? project;
  const canSubmit = normalizeTitle(parsed.title) !== "";

  // Escape clears the text, a second Escape leaves the field
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape" || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (title) {
      setTitle("");
      return;
    }
    event.currentTarget.blur();
    setEngaged(false);
  };

  // Adds the parsed task and empties the field
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = {
      title: parsed.title,
      dueDate: effectiveDueDate,
      important: effectiveImportant,
      repeat: parsed.repeat,
      projectId: effectiveProject,
      tags: mergeTags(tags, parsed.tags),
    };
    if (dispatch(addTask(draft))) {
      setTitle("");
    }
  };

  return (
    <form
      ref={formRef}
      className={styles.composer}
      data-engaged={expanded || undefined}
      data-glass-light=""
      onSubmit={handleSubmit}
    >
      <Icon name="plus" className={styles.leading} />
      <input
        ref={inputRef}
        id={COMPOSER_INPUT_ID}
        className={styles.input}
        value={title}
        placeholder={t("composer.placeholder")}
        aria-label={t("composer.label")}
        maxLength={MAX_TITLE_LENGTH + 40}
        autoComplete="off"
        enterKeyHint="done"
        onFocus={() => setEngaged(true)}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className={styles.options}>
        <IconButton
          icon="star"
          iconFilled={effectiveImportant}
          label={t("composer.important")}
          variant="ghost"
          size="small"
          className={styles.star}
          aria-pressed={effectiveImportant}
          onClick={() => setImportant(!important)}
        />
        <DuePicker
          value={effectiveDueDate}
          onChange={setDueDate}
          variant="chip"
          label={t("composer.dueDate")}
          detected={parsed.dueDate !== null}
        />
        {projects.length > 0 ? (
          <ProjectPicker
            value={effectiveProject}
            onChange={setProject}
            detected={parsed.projectId !== null}
            hideEmptyLabel
          />
        ) : null}
        <TagPicker value={tags} detected={parsed.tags} onChange={setTags} hideEmptyLabel />
        {parsed.repeat ? (
          <span className={styles.repeat} title={t("composer.detected")}>
            <Icon name="repeat" className={styles.repeatIcon} />
            <span>{t(`repeat.${parsed.repeat}`)}</span>
          </span>
        ) : null}
      </div>
      <IconButton
        type="submit"
        icon="arrowUp"
        label={t("composer.submit")}
        variant="accent"
        className={styles.submit}
        disabled={!canSubmit}
      />
    </form>
  );
};

export default TaskComposer;
