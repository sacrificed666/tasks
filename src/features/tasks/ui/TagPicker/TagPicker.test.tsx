import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeState, makeTask } from "@/test/factories";
import { openPopover, renderWithStore } from "@/test/render";

import TagPicker from "./TagPicker";

const tasks = [makeTask({ id: "a", title: "Water the plants", tags: ["#home", "#Garden"] })];

// Opens the tag picker of a task with these tags
const openPicker = async (value: string[], detected: string[] = []) => {
  const onChange = vi.fn<(tags: string[]) => void>();
  const { user } = renderWithStore(<TagPicker value={value} onChange={onChange} detected={detected} />, {
    preloadedState: makeState(tasks),
  });
  const chip = screen.getByRole("button", { name: value.length + detected.length > 0 ? /^Tags: /u : "Tags" });
  const picker = await openPopover(user, chip);
  return { onChange, picker, user };
};

describe("TagPicker", () => {
  it("adds and removes the tags the other tasks use", async () => {
    const { onChange, picker, user } = await openPicker(["#home"]);
    expect(picker.getByRole("button", { name: "home" })).toHaveAttribute("aria-pressed", "true");
    await user.click(picker.getByRole("button", { name: "Garden" }));
    expect(onChange).toHaveBeenLastCalledWith(["#home", "#Garden"]);
    await user.click(picker.getByRole("button", { name: "home" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("creates a new tag, and picks an existing one whatever its case", async () => {
    const { onChange, picker, user } = await openPicker([]);
    const field = picker.getByRole("textbox", { name: "Find or create a tag" });
    await user.type(field, "travel");
    expect(picker.getByRole("button", { name: "Create #travel" })).toBeInTheDocument();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["#travel"]);
    expect(field).toHaveValue("");
    await user.type(field, "#garden{Enter}");
    expect(onChange).toHaveBeenLastCalledWith(["#Garden"]);
  });

  it("keeps the tags typed in the title and moves with the arrow keys", async () => {
    const { onChange, picker, user } = await openPicker([], ["#home"]);
    const typed = picker.getByRole("button", { name: "home" });
    expect(typed).toBeDisabled();
    expect(typed).toHaveAttribute("title", "Recognised from the title");
    const field = picker.getByRole("textbox", { name: "Find or create a tag" });
    // The field takes the focus a frame after the list opens
    await waitFor(() => expect(field).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    expect(picker.getByRole("button", { name: "Garden" })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(field).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("says when there is nothing to pick and stops at ten tags", async () => {
    const full = Array.from({ length: 10 }, (_, index) => `#tag${index}`);
    const { picker } = await openPicker(full);
    expect(picker.getByRole("button", { name: "Garden" })).toBeDisabled();
    expect(picker.queryByRole("button", { name: /^Create/u })).not.toBeInTheDocument();
  });

  it("explains how to start when no task has a tag yet", async () => {
    const onChange = vi.fn<(tags: string[]) => void>();
    const { user } = renderWithStore(<TagPicker value={[]} onChange={onChange} />, { preloadedState: makeState([]) });
    const picker = await openPopover(user, screen.getByRole("button", { name: "Tags" }));
    expect(picker.getByText("No tags yet: type one above.")).toBeInTheDocument();
  });
});
