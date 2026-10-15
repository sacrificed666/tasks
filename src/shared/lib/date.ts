const DAY = 86_400_000;
const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

const formatters = new Map<string, Intl.DateTimeFormat>();
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

// A cached date formatter for a locale and options
const dateFormatter = (locale: string, options: Intl.DateTimeFormatOptions) => {
  const key = `${locale}:${JSON.stringify(options)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, formatter);
  }
  return formatter;
};

// A cached formatter for yesterday, today and tomorrow
const relativeFormatter = (locale: string) => {
  let formatter = relativeFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    relativeFormatters.set(locale, formatter);
  }
  return formatter;
};

export type DueTone = "overdue" | "today" | "upcoming";

// The first letter in upper case for the locale
const capitalize = (value: string, locale: string) => value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);

// A local date as YYYY-MM-DD
export const toDateKey = (date: Date) =>
  [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, "0")).join("-");

// A date key as a local date at midnight
export const fromDateKey = (key: string) => {
  const [, year = "0", month = "1", day = "1"] = DATE_KEY.exec(key) ?? [];
  return new Date(Number(year), Number(month) - 1, Number(day));
};

// Whether a value is a valid date key
export const isDateKey = (value: unknown): value is string =>
  typeof value === "string" && DATE_KEY.test(value) && toDateKey(fromDateKey(value)) === value;

// A date key moved by a number of days
export const addDays = (key: string, days: number) => {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

// A date key moved by months, kept within the shorter month
export const addMonths = (key: string, months: number) => {
  const date = fromDateKey(key);
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return toDateKey(target);
};

// The month name, with the year when it is not this year
export const formatMonth = (key: string, today: string, locale = "en") => {
  const date = fromDateKey(key);
  const sameYear = date.getFullYear() === fromDateKey(today).getFullYear();
  return capitalize(
    dateFormatter(locale, sameYear ? { month: "long" } : { month: "long", year: "numeric" }).format(date),
    locale,
  );
};

// Whole days from one date key to another
export const daysBetween = (from: string, to: string) =>
  Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / DAY);

// Weekday, day and month for section titles
export const formatHeadline = (key: string, locale = "en") =>
  capitalize(
    dateFormatter(locale, { weekday: "long", month: "long", day: "numeric" }).format(fromDateKey(key)),
    locale,
  );

// A short weekday name
export const formatWeekdayShort = (key: string, locale = "en") =>
  capitalize(dateFormatter(locale, { weekday: "short" }).format(fromDateKey(key)), locale);

// A date with the time
export const formatDateTime = (timestamp: number, locale = "en") =>
  dateFormatter(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp));

// A due date as text and tone: relative, weekday or date
export const describeDueDate = (dueDate: string, today: string, locale = "en"): { label: string; tone: DueTone } => {
  const offset = daysBetween(today, dueDate);
  const date = fromDateKey(dueDate);
  const tone: DueTone = offset < 0 ? "overdue" : offset === 0 ? "today" : "upcoming";

  if (Math.abs(offset) <= 1)
    return { label: capitalize(relativeFormatter(locale).format(offset, "day"), locale), tone };
  if (offset > 1 && offset < 7)
    return { label: capitalize(dateFormatter(locale, { weekday: "long" }).format(date), locale), tone };

  const sameYear = date.getFullYear() === fromDateKey(today).getFullYear();
  const options: Intl.DateTimeFormatOptions = sameYear
    ? { weekday: "short", month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" };
  return { label: capitalize(dateFormatter(locale, options).format(date), locale), tone };
};

// Month and year
export const formatMonthYear = (key: string, locale = "en") =>
  capitalize(dateFormatter(locale, { month: "long", year: "numeric" }).format(fromDateKey(key)), locale);

// A full date with the weekday
export const formatLongDate = (key: string, locale = "en") =>
  dateFormatter(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(fromDateKey(key));

// A weekday name in the given width
export const formatWeekday = (key: string, locale = "en", width: "narrow" | "short" | "long" = "long") =>
  capitalize(dateFormatter(locale, { weekday: width }).format(fromDateKey(key)), locale);

// The first day of the month
export const startOfMonth = (key: string) => `${key.slice(0, 7)}-01`;

// The first day of the week for a week start
export const startOfWeek = (key: string, weekStart: number) =>
  addDays(key, -((fromDateKey(key).getDay() - weekStart + 7) % 7));

// The given weekday on or after a date
export const nextWeekday = (key: string, weekday: number) =>
  addDays(key, (weekday - fromDateKey(key).getDay() + 7) % 7);

interface WeekInfoLocale {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
}

// The first weekday of a locale, Sunday as 0
export const firstDayOfWeek = (locale: string) => {
  try {
    const info = new Intl.Locale(locale) as Intl.Locale & WeekInfoLocale;
    const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    if (firstDay !== undefined) return firstDay % 7;
  } catch {
    return 1;
  }
  return locale === "en" || locale.startsWith("en-US") ? 0 : 1;
};
