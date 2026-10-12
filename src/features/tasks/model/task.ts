import { nanoid } from "@reduxjs/toolkit";

import { isDateKey, toDateKey } from "@/shared/lib/date";
import { isEntityId, isRecord, readTimestamp } from "@/shared/lib/guards";
import { normalizeForSearch, normalizeLine } from "@/shared/lib/text";

import { parseSubtasks, type Subtask } from "./subtasks";

export const REPEATS = ["daily", "weekdays", "weekly", "monthly", "yearly"] as const;

export type Repeat = (typeof REPEATS)[number];

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  important: boolean;
  dueDate: string | null;
  repeat: Repeat | null;
  repeatAnchor: string | null;
  projectId: string | null;
  tags: string[];
  notes: string;
  subtasks: Subtask[];
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface TaskDraft {
  title: string;
  important?: boolean;
  dueDate?: string | null;
  repeat?: Repeat | null;
  projectId?: string | null;
  tags?: readonly string[];
  notes?: string;
}

// Whether a value is a repeat interval
const isRepeat = (value: unknown): value is Repeat =>
  typeof value === "string" && (REPEATS as readonly string[]).includes(value);

export const MAX_TITLE_LENGTH = 200;
export const MAX_NOTES_LENGTH = 2000;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 32;

const TAG = /(^|\s)#([\p{L}\p{N}_-]+)/gu;
const TAG_NAME = /^[\p{L}\p{N}_-]+$/u;

// A title on one line within the length limit
export const normalizeTitle = (value: string) => normalizeLine(value, MAX_TITLE_LENGTH);

// Notes with plain line breaks within the length limit
export const normalizeNotes = (value: string) =>
  Array.from(value.replaceAll("\r\n", "\n").trimEnd()).slice(0, MAX_NOTES_LENGTH).join("");

// The #tags of a title
export const extractTags = (title: string) => [...title.matchAll(TAG)].map((match) => `#${match[2] ?? ""}`);

// A title without its #tags
export const stripTags = (title: string) => title.replaceAll(TAG, "$1").replaceAll(/\s+/g, " ").trim();

// A tag as #name, or null when it has spaces or other signs
export const normalizeTag = (value: string) => {
  const name = Array.from(value.trim().replace(/^#+/, "")).slice(0, MAX_TAG_LENGTH).join("");
  return TAG_NAME.test(name) ? `#${name}` : null;
};

// Tags of both lists without repeats in any letter case, within the limit
export const mergeTags = (...lists: ReadonlyArray<readonly string[]>) => {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const value of lists.flat()) {
    const tag = normalizeTag(value);
    const key = tag?.toLocaleLowerCase();
    if (!tag || !key || seen.has(key)) continue;
    seen.add(key);
    merged.push(tag);
  }
  return merged.slice(0, MAX_TAGS);
};

// The #tags of a title moved out of it, unless nothing else would be left
export const splitTitleTags = (title: string) => {
  const rest = normalizeTitle(stripTags(title));
  return rest ? { title: rest, tags: mergeTags(extractTags(title)) } : { title: normalizeTitle(title), tags: [] };
};

// Whether two lists hold the same tags in the same order
export const sameTags = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((tag, index) => tag === b[index]);

// A search test that ignores case and accents
export const createMatcher = (query: string) => {
  const needle = normalizeForSearch(query);
  return (title: string) => needle === "" || normalizeForSearch(title).includes(needle);
};

// A new open task; a repeat without a date starts today, #tags leave the title
export const createTask = (
  { title, important = false, dueDate = null, repeat = null, projectId = null, tags = [], notes = "" }: TaskDraft,
  now: number,
  id: string = nanoid(),
): Task => {
  const date = isDateKey(dueDate) ? dueDate : repeat ? toDateKey(new Date(now)) : null;
  const named = splitTitleTags(title);
  return {
    id,
    title: named.title,
    completed: false,
    important,
    dueDate: date,
    repeat,
    repeatAnchor: repeat ? date : null,
    projectId: isEntityId(projectId) ? projectId : null,
    tags: mergeTags(tags, named.tags),
    notes: normalizeNotes(notes),
    subtasks: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
};

// Valid tasks of a document, or null when it has none
export const parseTasks = (input: unknown, now: number = Date.now()): Task[] | null => {
  const list = isRecord(input) && Array.isArray(input.tasks) ? input.tasks : null;
  if (!list) return null;

  const seen = new Set<string>();

  return list.flatMap((entry) => {
    if (!isRecord(entry)) return [];

    const title = typeof entry.title === "string" ? normalizeTitle(entry.title) : "";
    if (!title) return [];
    const tags = Array.isArray(entry.tags) ? entry.tags.filter((tag) => typeof tag === "string") : [];

    const id = isEntityId(entry.id) && !seen.has(entry.id) ? entry.id : nanoid();
    seen.add(id);

    const completed = entry.completed === true;
    const createdAt = readTimestamp(entry.createdAt, now);
    const updatedAt = Math.max(readTimestamp(entry.updatedAt, createdAt), createdAt);

    const dueDate = isDateKey(entry.dueDate) ? entry.dueDate : null;
    const repeat = dueDate !== null && isRepeat(entry.repeat) ? entry.repeat : null;
    const anchor =
      isDateKey(entry.repeatAnchor) && dueDate !== null && entry.repeatAnchor <= dueDate ? entry.repeatAnchor : dueDate;

    return [
      {
        id,
        title,
        completed,
        important: entry.important === true,
        dueDate,
        repeat,
        repeatAnchor: repeat ? anchor : null,
        projectId: isEntityId(entry.projectId) ? entry.projectId : null,
        tags: mergeTags(tags),
        notes: typeof entry.notes === "string" ? normalizeNotes(entry.notes) : "",
        subtasks: Array.isArray(entry.subtasks) ? parseSubtasks(entry.subtasks) : [],
        createdAt,
        updatedAt,
        completedAt: completed ? readTimestamp(entry.completedAt, updatedAt) : null,
      },
    ];
  });
};
