import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { openPopover, renderWithStore } from "@/test/render";

import { PROJECT_EMOJI } from "../../model/project";
import EmojiPicker from "./EmojiPicker";

const [first = "", second = ""] = PROJECT_EMOJI;

// Opens the emoji grid of a project icon
const openPicker = async (emoji: string | null) => {
  const onChange = vi.fn<(emoji: string | null) => void>();
  const { user } = renderWithStore(<EmojiPicker name="Work" emoji={emoji} color="blue" onChange={onChange} />);
  const grid = await openPopover(user, screen.getByRole("button", { name: "Choose an emoji" }));
  return { grid, onChange, user };
};

describe("EmojiPicker", () => {
  it("picks an emoji or the plain dot and closes", async () => {
    const { grid, onChange, user } = await openPicker(null);
    expect(grid.getByRole("group", { name: "Emoji" })).toBeInTheDocument();
    expect(grid.getByRole("button", { name: "No emoji" })).toHaveAttribute("aria-pressed", "true");
    await user.click(grid.getByRole("button", { name: first }));
    expect(onChange).toHaveBeenCalledWith(first);
  });

  it("moves through the grid with the arrow keys, Home and End", async () => {
    const { grid, user } = await openPicker(first);
    const buttons = within(grid.getByRole("group", { name: "Emoji" })).getAllByRole("button");
    grid.getByRole("button", { name: first }).focus();
    await user.keyboard("{ArrowRight}");
    expect(grid.getByRole("button", { name: second })).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(grid.getByRole("button", { name: "No emoji" })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(grid.getByRole("button", { name: "No emoji" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(buttons[8]).toHaveFocus();
    await user.keyboard("{End}");
    expect(buttons.at(-1)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(buttons[0]).toHaveFocus();
  });
});
