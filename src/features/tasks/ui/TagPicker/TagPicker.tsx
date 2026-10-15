import { useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { useAppSelector } from "@/app/hooks";
import { useI18n } from "@/shared/i18n/useI18n";
import { cx } from "@/shared/lib/cx";
import { normalizeForSearch } from "@/shared/lib/text";
import Icon from "@/shared/ui/Icon/Icon";
import Popover from "@/shared/ui/Popover/Popover";
import { usePopover } from "@/shared/ui/Popover/usePopover";

import { selectAllTags } from "../../model/selectors";
import { MAX_TAG_LENGTH, MAX_TAGS, mergeTags, normalizeTag } from "../../model/task";

import styles from "./TagPicker.module.scss";

interface TagPickerProps {
  value: readonly string[];
  onChange: (tags: string[]) => void;
  detected?: readonly string[];
  hideEmptyLabel?: boolean;
  className?: string;
}

const NONE: readonly string[] = [];

// Lower case for comparing tags
const keyOf = (tag: string) => tag.toLocaleLowerCase();

// A chip that picks, finds and creates the tags of a task
const TagPicker = ({ value, onChange, detected = NONE, hideEmptyLabel = false, className }: TagPickerProps) => {
  const { t } = useI18n();
  const known = useAppSelector(selectAllTags);
  const popover = usePopover();
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const shown = mergeTags(value, detected);
  const chosen = new Set(shown.map(keyOf));
  const typed = new Set(detected.map(keyOf));
  const full = shown.length >= MAX_TAGS;
  const needle = normalizeForSearch(draft.replace(/^#+/, ""));
  const listed = [...shown, ...known.filter((tag) => !chosen.has(keyOf(tag)))];
  const options = listed.filter((tag) => normalizeForSearch(tag.slice(1)).includes(needle));
  const candidate = normalizeTag(draft);
  const fresh = candidate !== null && !listed.some((tag) => keyOf(tag) === keyOf(candidate));

  // Renders the list and puts the cursor in the search field once it shows
  const handleToggle = (next: boolean) => {
    if (!next) {
      setOpen(false);
      setDraft("");
      return;
    }
    flushSync(() => setOpen(true));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Adds or removes a tag; tags typed in the title stay until they are erased there
  const toggle = (tag: string) => {
    const key = keyOf(tag);
    if (typed.has(key)) return;
    if (chosen.has(key)) onChange(value.filter((entry) => keyOf(entry) !== key));
    else if (!full) onChange(mergeTags(value, [tag]));
  };

  // Adds the typed tag, or the existing one it names, and clears the field
  const addTyped = () => {
    if (!candidate) return;
    const existing = listed.find((tag) => keyOf(tag) === keyOf(candidate));
    if (!chosen.has(keyOf(candidate)) && !full) onChange(mergeTags(value, [existing ?? candidate]));
    setDraft("");
  };

  // Moves the focus between the field and the options with the arrow keys
  const moveFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = [...(bodyRef.current?.querySelectorAll<HTMLElement>("input, button:not(:disabled)") ?? [])];
    const index = items.findIndex((item) => item === event.currentTarget);
    const next = items[index + (event.key === "ArrowDown" ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  // Enter adds the typed tag instead of sending the surrounding form
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      addTyped();
      return;
    }
    moveFocus(event);
  };

  const label = shown.length > 0 ? shown.map((tag) => tag.slice(1)).join(", ") : t("tags.title");

  return (
    <>
      <button
        type="button"
        className={cx(styles.chip, className)}
        data-active={shown.length > 0 ? "" : undefined}
        data-detected={detected.length > 0 ? "" : undefined}
        aria-label={shown.length > 0 ? t("tags.chip", { tags: shown.join(", ") }) : t("tags.title")}
        title={detected.length > 0 ? t("composer.detected") : undefined}
        {...popover.triggerProps}
      >
        <Icon name="hash" className={styles.icon} />
        {shown.length > 0 || !hideEmptyLabel ? <span className={styles.label}>{label}</span> : null}
      </button>
      <Popover
        id={popover.id}
        popoverRef={popover.ref}
        anchorName={popover.anchorName}
        label={t("tags.title")}
        className={styles.panel}
        onToggle={handleToggle}
      >
        {open ? (
          <div ref={bodyRef}>
            <p className={styles.heading}>{t("tags.title")}</p>
            <input
              ref={inputRef}
              className={styles.search}
              value={draft}
              maxLength={MAX_TAG_LENGTH + 1}
              placeholder={t("tags.find")}
              aria-label={t("tags.find")}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            {options.map((tag) => (
              <button
                key={keyOf(tag)}
                type="button"
                className={styles.option}
                aria-pressed={chosen.has(keyOf(tag))}
                disabled={typed.has(keyOf(tag)) || (full && !chosen.has(keyOf(tag)))}
                title={typed.has(keyOf(tag)) ? t("composer.detected") : undefined}
                onClick={() => toggle(tag)}
                onKeyDown={moveFocus}
              >
                <Icon name="hash" className={styles.optionIcon} />
                <span className={styles.optionLabel}>{tag.slice(1)}</span>
                <Icon name="check" className={styles.check} />
              </button>
            ))}
            {fresh && !full ? (
              <button type="button" className={styles.option} onClick={addTyped} onKeyDown={moveFocus}>
                <Icon name="plus" className={styles.optionIcon} />
                <span className={styles.optionLabel}>{t("tags.create", { tag: candidate })}</span>
              </button>
            ) : null}
            {options.length === 0 && !fresh ? <p className={styles.empty}>{t("tags.empty")}</p> : null}
          </div>
        ) : null}
      </Popover>
    </>
  );
};

export default TagPicker;
