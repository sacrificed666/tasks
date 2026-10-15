import { useState } from "react";
import { flushSync } from "react-dom";

import { useI18n } from "@/shared/i18n/useI18n";
import Icon from "@/shared/ui/Icon/Icon";
import Popover from "@/shared/ui/Popover/Popover";
import { usePopover } from "@/shared/ui/Popover/usePopover";

import { REPEATS, type Repeat } from "../../model/task";

import styles from "./RepeatPicker.module.scss";

interface RepeatPickerProps {
  value: Repeat | null;
  onChange: (value: Repeat | null) => void;
}

const OPTIONS: readonly (Repeat | null)[] = [null, ...REPEATS];

// A chip that opens the repeat options
const RepeatPicker = ({ value, onChange }: RepeatPickerProps) => {
  const { t } = useI18n();
  const popover = usePopover();
  const [open, setOpen] = useState(false);
  const label = value ? t(`repeat.${value}`) : t("repeat.heading");

  // Renders the options before the popover shows
  const handleToggle = (next: boolean) => {
    if (next) flushSync(() => setOpen(true));
    else setOpen(false);
  };

  // Applies a repeat and closes the options
  const choose = (option: Repeat | null) => {
    popover.close();
    onChange(option);
  };

  return (
    <>
      <button
        type="button"
        className={styles.chip}
        data-active={value ? "" : undefined}
        aria-label={value ? t("repeat.chip", { rule: label }) : label}
        {...popover.triggerProps}
      >
        <Icon name="repeat" className={styles.icon} />
        <span>{label}</span>
      </button>
      <Popover
        id={popover.id}
        popoverRef={popover.ref}
        anchorName={popover.anchorName}
        label={t("repeat.heading")}
        className={styles.panel}
        onToggle={handleToggle}
      >
        {open ? (
          <>
            <p className={styles.heading}>{t("repeat.heading")}</p>
            {OPTIONS.map((option) => (
              <button
                key={option ?? "none"}
                type="button"
                className={styles.option}
                aria-pressed={option === value}
                onClick={() => choose(option)}
              >
                <span className={styles.optionLabel}>{option ? t(`repeat.${option}`) : t("repeat.none")}</span>
                <Icon name="check" className={styles.check} />
              </button>
            ))}
          </>
        ) : null}
      </Popover>
    </>
  );
};

export default RepeatPicker;
