import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import {
  addDays,
  addMonths,
  formatLongDate,
  formatMonthYear,
  formatWeekday,
  fromDateKey,
  startOfMonth,
  startOfWeek,
} from "@/shared/lib/date";

import IconButton from "../IconButton/IconButton";

import styles from "./Calendar.module.scss";

export interface CalendarLabels {
  previous: string;
  next: string;
  describe?: (count: number) => string;
}

interface CalendarProps {
  value: string | null;
  today: string;
  locale: string;
  weekStart: number;
  labels: CalendarLabels;
  marks?: ReadonlyMap<string, number>;
  onSelect: (date: string) => void;
}

const WEEKS = 6;

const KEY_STEPS: Readonly<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

// A month grid with arrow key navigation and dots on busy days
const Calendar = ({ value, today, locale, weekStart, labels, marks, onSelect }: CalendarProps) => {
  const gridRef = useRef<HTMLTableElement>(null);
  const monthId = useId();
  const moved = useRef(false);
  const [focused, setFocused] = useState(value ?? today);
  const month = startOfMonth(focused);
  const first = startOfWeek(month, weekStart);
  const days = Array.from({ length: WEEKS * 7 }, (_, index) => addDays(first, index));
  const weeks = Array.from({ length: WEEKS }, (_, index) => days.slice(index * 7, index * 7 + 7));

  // Moves the focus after a keyboard step
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)?.focus();
  }, [focused]);

  // Focuses another day, changing the month when needed
  const moveTo = (date: string) => {
    moved.current = true;
    setFocused(date);
  };

  // Moves the focused day by whole months
  const shiftMonth = (delta: number) => setFocused(addMonths(focused, delta));

  // Arrows move by day and week, Home and End, Page keys by month
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const step = KEY_STEPS[event.key];
    let next: string | null = null;
    if (step !== undefined) next = addDays(date, step);
    else if (event.key === "Home") next = startOfWeek(date, weekStart);
    else if (event.key === "End") next = addDays(startOfWeek(date, weekStart), 6);
    else if (event.key === "PageUp") next = addMonths(date, event.shiftKey ? -12 : -1);
    else if (event.key === "PageDown") next = addMonths(date, event.shiftKey ? 12 : 1);
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    moveTo(next);
  };

  // The full date with the number of tasks on it
  const describe = (date: string) => {
    const count = marks?.get(date) ?? 0;
    const label = formatLongDate(date, locale);
    return count > 0 && labels.describe ? `${label}, ${labels.describe(count)}` : label;
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        <p id={monthId} className={styles.month} aria-live="polite">
          {formatMonthYear(month, locale)}
        </p>
        <IconButton
          icon="chevronLeft"
          label={labels.previous}
          variant="ghost"
          size="small"
          onClick={() => shiftMonth(-1)}
        />
        <IconButton
          icon="chevronRight"
          label={labels.next}
          variant="ghost"
          size="small"
          onClick={() => shiftMonth(1)}
        />
      </div>
      <table ref={gridRef} className={styles.grid} aria-labelledby={monthId}>
        <thead>
          <tr>
            {weeks[0]?.map((date) => (
              <th key={date} scope="col" abbr={formatWeekday(date, locale)} className={styles.weekday}>
                {formatWeekday(date, locale, "narrow")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((date) => {
                const count = marks?.get(date) ?? 0;
                return (
                  <td key={date}>
                    <button
                      type="button"
                      className={styles.day}
                      data-date={date}
                      data-outside={date.slice(0, 7) === month.slice(0, 7) ? undefined : ""}
                      data-past={date < today ? "" : undefined}
                      tabIndex={date === focused ? 0 : -1}
                      data-autofocus={date === focused ? "" : undefined}
                      aria-pressed={date === value}
                      aria-current={date === today ? "date" : undefined}
                      aria-label={describe(date)}
                      onClick={() => onSelect(date)}
                      onKeyDown={(event) => handleKeyDown(event, date)}
                    >
                      {fromDateKey(date).getDate()}
                      {count > 0 ? <span className={styles.mark} data-many={count > 2 ? "" : undefined} /> : null}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Calendar;
