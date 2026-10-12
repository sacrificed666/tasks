import { describe, expect, it } from "vitest";

import {
  addDays,
  daysBetween,
  describeDueDate,
  firstDayOfWeek,
  formatHeadline,
  formatLongDate,
  formatMonthYear,
  formatWeekday,
  fromDateKey,
  isDateKey,
  nextWeekday,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from "./date";

describe("date keys", () => {
  it("round-trips local calendar dates", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(fromDateKey("2026-01-05").getDate()).toBe(5);
  });

  it("validates keys", () => {
    expect(isDateKey("2026-10-01")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("01.10.2026")).toBe(false);
    expect(isDateKey(20_261_001)).toBe(false);
  });

  it("adds days across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(daysBetween("2026-10-01", "2026-10-08")).toBe(7);
  });

  it("formats headlines", () => {
    expect(formatHeadline("2026-10-01")).toBe("Thursday, October 1");
  });
});

describe("describeDueDate", () => {
  const today = "2026-10-01";

  it("uses relative names for nearby days", () => {
    expect(describeDueDate("2026-10-01", today)).toEqual({ label: "Today", tone: "today" });
    expect(describeDueDate("2026-10-02", today)).toEqual({ label: "Tomorrow", tone: "upcoming" });
    expect(describeDueDate("2026-09-30", today)).toEqual({ label: "Yesterday", tone: "overdue" });
    expect(describeDueDate("2026-10-04", today)).toEqual({ label: "Sunday", tone: "upcoming" });
  });

  it("falls back to calendar dates", () => {
    expect(describeDueDate("2026-10-20", today)).toEqual({ label: "Tue, Oct 20", tone: "upcoming" });
    expect(describeDueDate("2026-09-20", today)).toEqual({ label: "Sun, Sep 20", tone: "overdue" });
    expect(describeDueDate("2027-01-15", today)).toEqual({ label: "Jan 15, 2027", tone: "upcoming" });
  });
});

describe("calendar helpers", () => {
  it("finds the start of the month and of the week", () => {
    expect(startOfMonth("2026-10-17")).toBe("2026-10-01");
    expect(startOfWeek("2026-10-01", 1)).toBe("2026-09-28");
    expect(startOfWeek("2026-10-01", 0)).toBe("2026-09-27");
    expect(startOfWeek("2026-09-28", 1)).toBe("2026-09-28");
  });

  it("finds the next given weekday, today included", () => {
    expect(nextWeekday("2026-10-01", 6)).toBe("2026-10-03");
    expect(nextWeekday("2026-10-03", 6)).toBe("2026-10-03");
  });

  it("formats months, long dates and weekdays per locale", () => {
    expect(formatMonthYear("2026-10-01", "en")).toBe("October 2026");
    expect(formatMonthYear("2026-10-01", "uk")).toBe("Жовтень 2026 р.");
    expect(formatLongDate("2026-10-01", "en")).toBe("Thursday, October 1, 2026");
    expect(formatWeekday("2026-10-01", "en", "narrow")).toBe("T");
  });

  it("knows which day starts the week", () => {
    expect(firstDayOfWeek("en-US")).toBe(0);
    expect(firstDayOfWeek("uk")).toBe(1);
    expect(firstDayOfWeek("en-GB")).toBe(1);
  });
});
