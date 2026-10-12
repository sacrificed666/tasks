import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";

import Calendar from "./Calendar";

// Renders the calendar with sample props and overrides
const renderCalendar = (props: Partial<ComponentProps<typeof Calendar>> = {}) => {
  const onSelect = vi.fn<(date: string) => void>();
  const user = userEvent.setup();
  render(
    <Calendar
      value={null}
      today="2026-10-01"
      locale="en"
      weekStart={1}
      labels={{ previous: "Previous month", next: "Next month", describe: (count) => `${count} tasks` }}
      marks={new Map([["2026-10-05", 2]])}
      onSelect={onSelect}
      {...props}
    />,
  );
  return { user, onSelect };
};

// A day of the calendar by its name
const day = (name: string) => screen.getByRole("button", { name });

describe("Calendar", () => {
  it("starts the week on the given day", () => {
    renderCalendar();
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute("abbr", "Monday");
  });

  it("starts the week on Sunday where that is the custom", () => {
    renderCalendar({ weekStart: 0 });
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute("abbr", "Sunday");
    expect(day("Sunday, September 27, 2026")).toBeInTheDocument();
  });

  it("marks today, the selected day and days with tasks", () => {
    renderCalendar({ value: "2026-10-03" });
    expect(day("Thursday, October 1, 2026")).toHaveAttribute("aria-current", "date");
    expect(day("Saturday, October 3, 2026")).toHaveAttribute("aria-pressed", "true");
    expect(day("Monday, October 5, 2026, 2 tasks")).toBeInTheDocument();
    expect(day("Monday, September 28, 2026")).toHaveAttribute("data-outside");
  });

  it("moves focus by day, week and month with the keyboard", async () => {
    const { user } = renderCalendar();
    day("Thursday, October 1, 2026").focus();

    await user.keyboard("{ArrowRight}");
    expect(day("Friday, October 2, 2026")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(day("Friday, October 9, 2026")).toHaveFocus();
    await user.keyboard("{End}");
    expect(day("Sunday, October 11, 2026")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(day("Monday, October 5, 2026, 2 tasks")).toHaveFocus();

    await user.keyboard("{PageDown}");
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(day("Thursday, November 5, 2026")).toHaveFocus();
    await user.keyboard("{Shift>}{PageUp}{/Shift}");
    expect(screen.getByText("November 2025")).toBeInTheDocument();
    expect(day("Wednesday, November 5, 2025")).toHaveAttribute("tabindex", "0");
  });

  it("changes months with the buttons and selects a day", async () => {
    const { user, onSelect } = renderCalendar();

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByText("September 2026")).toBeInTheDocument();

    await user.click(day("Saturday, September 12, 2026"));
    expect(onSelect).toHaveBeenCalledWith("2026-09-12");
  });
});
