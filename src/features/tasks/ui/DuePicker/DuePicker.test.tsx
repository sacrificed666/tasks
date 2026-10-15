import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { dayFromToday, todayKey } from "@/test/factories";
import { openPopover, renderWithStore } from "@/test/render";

import DuePicker from "./DuePicker";

// A due date picker with its changes recorded
const renderPicker = (value: string | null, variant: "chip" | "icon" = "chip", detected = false) => {
  const onChange = vi.fn<(value: string | null) => void>();
  const view = renderWithStore(
    <DuePicker value={value} onChange={onChange} variant={variant} label="Set a due date" detected={detected} />,
  );
  return { onChange, ...view };
};

describe("DuePicker", () => {
  it("offers quick dates and the calendar on an empty chip", async () => {
    const { onChange, user } = renderPicker(null);
    const chip = screen.getByRole("button", { name: "Set a due date" });
    const options = await openPopover(user, chip);
    expect(options.queryByRole("button", { name: "Remove date" })).not.toBeInTheDocument();
    await user.click(options.getByRole("button", { name: /^Tomorrow,/u }));
    expect(onChange).toHaveBeenCalledWith(dayFromToday(1));
  });

  it("shows the chosen date, marks it and removes it", async () => {
    const { onChange, user } = renderPicker(todayKey());
    const chip = screen.getByRole("button", { name: "Due date: Today" });
    const options = await openPopover(user, chip);
    expect(options.getByRole("button", { name: /^Today,/u })).toHaveAttribute("aria-pressed", "true");
    await user.click(options.getByRole("button", { name: "Remove date" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("follows a date changed from outside while open", async () => {
    const { onChange, user, rerender } = renderPicker(null);
    const options = await openPopover(user, screen.getByRole("button", { name: "Set a due date" }));
    rerender(<DuePicker value={dayFromToday(1)} onChange={onChange} variant="chip" label="Set a due date" />);
    expect(screen.getByRole("button", { name: "Due date: Tomorrow" })).toBeInTheDocument();
    expect(options.getByRole("button", { name: /^Tomorrow,/u })).toHaveAttribute("aria-pressed", "true");
    rerender(<DuePicker value={null} onChange={onChange} variant="chip" label="Pick a day" />);
    expect(screen.getByRole("button", { name: "Pick a day" })).toBeInTheDocument();
    expect(options.queryByRole("button", { name: "Remove date" })).not.toBeInTheDocument();
  });

  it("says when the date was recognised from the title", () => {
    renderPicker(dayFromToday(1), "chip", true);
    expect(screen.getByRole("button", { name: /^Due date:/u })).toHaveAttribute("title", "Recognised from the title");
  });

  it("opens from an icon button and picks a day of the calendar", async () => {
    const { onChange, user } = renderPicker(null, "icon");
    const options = await openPopover(user, screen.getByRole("button", { name: "Set a due date" }));
    const day = document.querySelector<HTMLButtonElement>(`[data-date="${dayFromToday(3)}"]`);
    if (!day) throw new Error("The day is not in the calendar");
    await user.click(day);
    expect(onChange).toHaveBeenCalledWith(dayFromToday(3));
    expect(options.queryByRole("button", { name: /^Tomorrow,/u })).not.toBeInTheDocument();
  });
});
