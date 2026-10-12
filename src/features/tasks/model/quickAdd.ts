import { addDays, fromDateKey, isDateKey, toDateKey } from "@/shared/lib/date";

import {
  BLOCKED_ENDINGS,
  EVERY_WORDS,
  fold,
  HABITUAL_WEEKDAYS,
  IN_DAYS,
  NEEDS_MODIFIER,
  RELATIVE_DAYS,
  REPEAT_FILLERS,
  REPEAT_PHRASES,
  UKRAINIAN_EVERY,
  WEEKDAY_MODIFIERS,
  WEEKDAYS,
} from "./quickAddPhrases";
import { splitTitleTags, type Repeat } from "./task";

export interface QuickAddResult {
  title: string;
  dueDate: string | null;
  important: boolean;
  repeat: Repeat | null;
  projectId: string | null;
  tags: string[];
}

export interface QuickAddProject {
  id: string;
  name: string;
  label?: string;
}

const DAY_MONTH = /^(\d{1,2})\.(\d{1,2})(?:\.(\d{4})?)?$/;
const IMPORTANT = /^!{1,3}$/;
const TAG = /^#[\p{L}\p{N}_-]+$/u;
const MAX_PHRASE = 4;

// The next given weekday after today
const nextWeekday = (today: string, weekday: number) => {
  const offset = (weekday - fromDateKey(today).getDay() + 7) % 7;
  return addDays(today, offset === 0 ? 7 : offset);
};

// A date key for a real calendar date, or null
const calendarDate = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? toDateKey(date) : null;
};

// A day and month, this year unless it has passed
const parseDayMonth = ([, day = "", month = "", year]: RegExpExecArray, today: string) => {
  if (year !== undefined) return calendarDate(Number(year), Number(month), Number(day));
  const current = fromDateKey(today).getFullYear();
  const thisYear = calendarDate(current, Number(month), Number(day));
  return thisYear !== null && thisYear >= today ? thisYear : calendarDate(current + 1, Number(month), Number(day));
};

// The weekday named in a phrase such as next friday
const parseWeekday = (words: readonly string[]): number | null => {
  const days = words.flatMap((word) => {
    const weekday = WEEKDAYS.get(word);
    return weekday === undefined ? [] : [weekday];
  });
  const [weekday] = days;
  if (days.length !== 1 || weekday === undefined) return null;
  if (words.length === 1 && NEEDS_MODIFIER.has(words[0] ?? "")) return null;
  return words.every((word) => WEEKDAYS.has(word) || WEEKDAY_MODIFIERS.has(word)) ? weekday : null;
};

// A due date from words such as tomorrow, in 3 days or 5.10
export const parseDatePhrase = (phrase: string, today: string): string | null => {
  const normalized = fold(phrase.trim());

  const relative = RELATIVE_DAYS.get(normalized);
  if (relative !== undefined) return addDays(today, relative);

  const inDays = IN_DAYS.exec(normalized);
  if (inDays) return addDays(today, Number(inDays[1]));

  const weekday = parseWeekday(normalized.split(" "));
  if (weekday !== null) return nextWeekday(today, weekday);

  if (isDateKey(normalized)) return normalized;

  const dayMonth = DAY_MONTH.exec(normalized);
  return dayMonth ? parseDayMonth(dayMonth, today) : null;
};

// Words such as every that may surround a repeat
const isRepeatFiller = (word: string) => EVERY_WORDS.has(word) || REPEAT_FILLERS.has(word);

// The given weekday, today included
const weekdayOnOrAfter = (today: string, weekday: number) =>
  addDays(today, (weekday - fromDateKey(today).getDay() + 7) % 7);

// A repeat and its first day from words such as every monday
const parseRepeatPhrase = (phrase: string, today: string): { repeat: Repeat; start: string | null } | null => {
  const normalized = fold(phrase.trim());
  const interval = REPEAT_PHRASES.get(normalized);
  if (interval) return { repeat: interval, start: null };

  const words = normalized.split(" ");
  const [single] = words;
  if (words.length === 1 && single?.startsWith(UKRAINIAN_EVERY)) {
    const weekday = WEEKDAYS.get(single.slice(UKRAINIAN_EVERY.length));
    if (weekday !== undefined) return { repeat: "weekly", start: weekdayOnOrAfter(today, weekday) };
  }

  const habitual = words.flatMap((word) => {
    const weekday = HABITUAL_WEEKDAYS.get(word);
    return weekday === undefined ? [] : [weekday];
  });
  const [habitualDay] = habitual;
  if (
    habitual.length === 1 &&
    habitualDay !== undefined &&
    !(words.length === 1 && NEEDS_MODIFIER.has(single ?? "")) &&
    words.every((word) => HABITUAL_WEEKDAYS.has(word) || isRepeatFiller(word))
  ) {
    return { repeat: "weekly", start: weekdayOnOrAfter(today, habitualDay) };
  }

  const days = words.flatMap((word) => {
    const weekday = WEEKDAYS.get(word);
    return weekday === undefined ? [] : [weekday];
  });
  const [day] = days;
  if (
    days.length === 1 &&
    day !== undefined &&
    words.some((word) => EVERY_WORDS.has(word)) &&
    words.every((word) => WEEKDAYS.has(word) || isRepeatFiller(word))
  ) {
    return { repeat: "weekly", start: weekdayOnOrAfter(today, day) };
  }

  return null;
};

// Endings such as am Morgen, where the date word means morning instead
const endsWithBlockedPhrase = (tokens: readonly string[], end: number) =>
  [2, 3].some((size) => end - size >= 0 && BLOCKED_ENDINGS.has(fold(tokens.slice(end - size, end).join(" "))));

const MENTION = /(^|\s)@/gu;

// Equal text, ignoring case and accents
const sameText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" }) === 0;

// The longest @project mention in the input
const findProjectMention = (input: string, projects: readonly QuickAddProject[]) => {
  const names = projects
    .flatMap((project) => [project.name, project.label ?? project.name].map((name) => ({ id: project.id, name })))
    .filter(({ name }) => name !== "")
    .toSorted((a, b) => b.name.length - a.name.length);
  if (names.length === 0) return null;

  for (const match of input.matchAll(MENTION)) {
    const at = match.index + (match[1] ?? "").length;
    const rest = input.slice(at + 1);
    for (const { id, name } of names) {
      const next = rest.charAt(name.length);
      if (sameText(rest.slice(0, name.length), name) && (next === "" || /\s/u.test(next))) {
        return { projectId: id, start: at, end: at + 1 + name.length };
      }
    }
  }
  return null;
};

// Title, date, repeat, priority, tags and project from one line
export const parseQuickAdd = (
  input: string,
  today: string,
  projects: readonly QuickAddProject[] = [],
): QuickAddResult => {
  const mention = findProjectMention(input, projects);
  const text = mention ? `${input.slice(0, mention.start)} ${input.slice(mention.end)}` : input;
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  const tags: string[] = [];
  let important = false;
  let dueDate: string | null = null;
  let repeat: Repeat | null = null;
  let repeatStart: string | null = null;
  let end = tokens.length;

  // Takes the longest matching phrase off the end of the title
  const takePhrase = <Value>(parse: (phrase: string) => Value | null): Value | null => {
    for (let size = MAX_PHRASE; size >= 1; size -= 1) {
      if (end - size < 1) continue;
      const value = parse(tokens.slice(end - size, end).join(" "));
      if (value !== null) {
        end -= size;
        return value;
      }
    }
    return null;
  };

  while (end > 1) {
    const token = tokens[end - 1] ?? "";
    if (IMPORTANT.test(token)) {
      important = true;
      end -= 1;
      continue;
    }
    if (TAG.test(token)) {
      tags.unshift(token);
      end -= 1;
      continue;
    }
    if (repeat === null) {
      const found = takePhrase((phrase) => parseRepeatPhrase(phrase, today));
      if (found) {
        repeat = found.repeat;
        repeatStart = found.start;
        continue;
      }
    }
    if (dueDate === null && !endsWithBlockedPhrase(tokens, end)) {
      const found = takePhrase((phrase) => parseDatePhrase(phrase, today));
      if (found) {
        dueDate = found;
        continue;
      }
    }
    break;
  }

  const named = splitTitleTags([...tokens.slice(0, end), ...tags].join(" "));
  return {
    title: named.title,
    dueDate: dueDate ?? repeatStart ?? (repeat ? today : null),
    important,
    repeat,
    projectId: mention?.projectId ?? null,
    tags: named.tags,
  };
};
