import { useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { useI18n } from "@/shared/i18n/useI18n";
import Icon from "@/shared/ui/Icon/Icon";
import Popover from "@/shared/ui/Popover/Popover";
import { usePopover } from "@/shared/ui/Popover/usePopover";

import { PROJECT_EMOJI, type ProjectColor } from "../../model/project";
import ProjectIcon from "../ProjectIcon/ProjectIcon";

import styles from "./EmojiPicker.module.scss";

interface EmojiPickerProps {
  name: string;
  emoji: string | null;
  color: ProjectColor;
  onChange: (emoji: string | null) => void;
}

const COLUMNS = 8;

const STEPS: Readonly<Partial<Record<string, number>>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -COLUMNS,
  ArrowDown: COLUMNS,
};

const OPTIONS: ReadonlyArray<string | null> = [null, ...PROJECT_EMOJI];

// The large project icon as a button that opens a grid of emoji
const EmojiPicker = ({ name, emoji, color, onChange }: EmojiPickerProps) => {
  const { t } = useI18n();
  const popover = usePopover();
  const gridRef = useRef<HTMLFieldSetElement>(null);
  const [open, setOpen] = useState(false);

  // Renders the grid and moves the focus to the chosen emoji once it shows
  const handleToggle = (next: boolean) => {
    if (!next) {
      setOpen(false);
      return;
    }
    flushSync(() => setOpen(true));
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>("[aria-pressed='true']")?.focus());
  };

  // Applies an emoji, or the dot, and closes the grid
  const choose = (value: string | null) => {
    popover.close();
    onChange(value);
  };

  // Arrow keys, Home and End move the focus through the grid
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const buttons = gridRef.current?.querySelectorAll("button");
    if (!buttons) return;
    const step = STEPS[event.key];
    const target =
      event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : step === undefined ? -1 : index + step;
    const button = buttons[target];
    if (!button) return;
    event.preventDefault();
    button.focus();
  };

  return (
    <>
      <button type="button" className={styles.trigger} aria-label={t("project.emojiPick")} {...popover.triggerProps}>
        <ProjectIcon name={name} emoji={emoji} color={color} size="large" />
        <span className={styles.badge} aria-hidden="true">
          <Icon name="smilePlus" />
        </span>
      </button>
      <Popover
        id={popover.id}
        popoverRef={popover.ref}
        anchorName={popover.anchorName}
        label={t("project.emoji")}
        align="start"
        className={styles.panel}
        onToggle={handleToggle}
      >
        {open ? (
          <fieldset ref={gridRef} className={styles.grid}>
            <legend className={styles.heading}>{t("project.emoji")}</legend>
            {OPTIONS.map((option, index) => (
              <button
                key={option ?? "none"}
                type="button"
                className={styles.option}
                aria-pressed={option === emoji}
                aria-label={option === null ? t("project.emojiNone") : undefined}
                onClick={() => choose(option)}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                {option ?? <span className={styles.dot} data-project-color={color} />}
              </button>
            ))}
          </fieldset>
        ) : null}
      </Popover>
    </>
  );
};

export default EmojiPicker;
