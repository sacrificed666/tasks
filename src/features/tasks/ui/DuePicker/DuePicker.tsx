import { useState } from "react";
import { flushSync } from "react-dom";

import { useAppSelector } from "@/app/hooks";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { useWeekStart } from "@/shared/i18n/useWeekStart";
import { cx } from "@/shared/lib/cx";
import { addDays, describeDueDate, formatWeekdayShort, fromDateKey, nextWeekday } from "@/shared/lib/date";
import Calendar from "@/shared/ui/Calendar/Calendar";
import Icon from "@/shared/ui/Icon/Icon";
import type { IconName } from "@/shared/ui/Icon/icons";
import IconButton from "@/shared/ui/IconButton/IconButton";
import Popover from "@/shared/ui/Popover/Popover";
import { usePopover } from "@/shared/ui/Popover/usePopover";

import { selectDueDateCounts } from "../../model/selectors";

import styles from "./DuePicker.module.scss";

export const QUICK_DATES = [
  { key: "due.today", icon: "sun", resolve: (today: string) => today },
  { key: "due.tomorrow", icon: "sunrise", resolve: (today: string) => addDays(today, 1) },
  {
    key: "due.weekend",
    icon: "weekend",
    resolve: (today: string) => ([0, 6].includes(fromDateKey(today).getDay()) ? today : nextWeekday(today, 6)),
  },
  { key: "due.nextWeek", icon: "nextWeek", resolve: (today: string) => addDays(today, 7) },
] as const satisfies readonly { key: string; icon: IconName; resolve: (today: string) => string }[];

interface DueOptionsProps {
  value: string | null;
  onChoose: (value: string | null) => void;
}

// Quick dates and a calendar with dots on busy days
const DueOptions = ({ value, onChoose }: DueOptionsProps) => {
  const today = useToday();
  const { t, intlLocale } = useI18n();
  const weekStart = useWeekStart();
  const marks = useAppSelector(selectDueDateCounts);

  return (
    <>
      <fieldset className={styles.quick}>
        <legend className="visually-hidden">{t("due.heading")}</legend>
        {QUICK_DATES.map((option) => {
          const date = option.resolve(today);
          return (
            <button
              key={option.key}
              type="button"
              className={styles.quickOption}
              aria-pressed={value === date}
              aria-label={`${t(option.key)}, ${formatWeekdayShort(date, intlLocale)}`}
              onClick={() => onChoose(date)}
            >
              <Icon name={option.icon} className={styles.quickIcon} />
              <span className={styles.quickLabel}>{t(option.key)}</span>
            </button>
          );
        })}
      </fieldset>
      <Calendar
        value={value}
        today={today}
        locale={intlLocale}
        weekStart={weekStart}
        marks={marks}
        labels={{
          previous: t("calendar.previous"),
          next: t("calendar.next"),
          describe: (count) => t("calendar.tasks", { count }),
        }}
        onSelect={onChoose}
      />
      {value ? (
        <button type="button" className={styles.remove} onClick={() => onChoose(null)}>
          <Icon name="xmark" className={styles.removeIcon} />
          {t("due.remove")}
        </button>
      ) : null}
    </>
  );
};

interface DuePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  variant: "chip" | "icon";
  label: string;
  detected?: boolean;
  className?: string;
}

// A chip that opens the due date options
const DuePicker = ({ value, onChange, variant, label, detected = false, className }: DuePickerProps) => {
  const today = useToday();
  const { t, intlLocale } = useI18n();
  const popover = usePopover();
  const [open, setOpen] = useState(false);
  const due = value ? describeDueDate(value, today, intlLocale) : null;

  // Renders the options before the popover shows
  const handleToggle = (next: boolean) => {
    if (next) flushSync(() => setOpen(true));
    else setOpen(false);
  };

  // Applies a date and closes the options
  const choose = (next: string | null) => {
    popover.close();
    onChange(next);
  };

  return (
    <>
      {variant === "chip" ? (
        <button
          type="button"
          className={cx(styles.chip, className)}
          data-tone={due?.tone}
          data-empty={due ? undefined : ""}
          data-detected={detected ? "" : undefined}
          data-due-trigger=""
          aria-label={due ? t("due.chip", { date: due.label }) : label}
          title={detected ? t("composer.detected") : undefined}
          {...popover.triggerProps}
        >
          <Icon name={detected ? "sparkles" : "calendar"} className={styles.chipIcon} />
          {due ? <span>{due.label}</span> : null}
        </button>
      ) : (
        <IconButton
          icon="calendar"
          label={label}
          variant="ghost"
          size="small"
          className={className}
          data-due-trigger=""
          {...popover.triggerProps}
        />
      )}
      <Popover
        id={popover.id}
        popoverRef={popover.ref}
        anchorName={popover.anchorName}
        label={t("due.heading")}
        className={styles.panel}
        onToggle={handleToggle}
      >
        {open ? (
          <>
            <p className={styles.heading}>{t("due.heading")}</p>
            <DueOptions value={value} onChoose={choose} />
          </>
        ) : null}
      </Popover>
    </>
  );
};

export default DuePicker;
