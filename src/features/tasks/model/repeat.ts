import { addDays, addMonths, fromDateKey } from "@/shared/lib/date";

import type { Repeat } from "./task";

const WEEKEND = new Set([0, 6]);
const MAX_STEPS = 5000;

// Months since year zero, to count whole months between dates
const monthIndex = (key: string) => Number(key.slice(0, 4)) * 12 + Number(key.slice(5, 7)) - 1;

// The next day, weekday or week of a repeat
const advanceDays = (key: string, repeat: Repeat) => {
  if (repeat === "weekly") return addDays(key, 7);
  let next = addDays(key, 1);
  if (repeat !== "weekdays") return next;
  while (WEEKEND.has(fromDateKey(next).getDay())) next = addDays(next, 1);
  return next;
};

// The next due date after today; months keep the first day
export const nextOccurrence = (dueDate: string, repeat: Repeat, today: string, anchor: string = dueDate) => {
  const months = repeat === "monthly" ? 1 : repeat === "yearly" ? 12 : 0;

  if (months === 0) {
    let next = advanceDays(dueDate, repeat);
    for (let step = 0; next <= today && step < MAX_STEPS; step += 1) next = advanceDays(next, repeat);
    return next;
  }

  let count = Math.max(Math.floor((monthIndex(dueDate) - monthIndex(anchor)) / months), 0) + 1;
  let next = addMonths(anchor, count * months);
  for (let step = 0; (next <= dueDate || next <= today) && step < MAX_STEPS; step += 1) {
    count += 1;
    next = addMonths(anchor, count * months);
  }
  return next;
};
