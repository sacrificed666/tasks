import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeProject, makeTask } from "@/test/factories";
import { renderApp } from "@/test/render";

// The command palette dialog
const palette = () => screen.getByRole("dialog", { name: "Command palette" });
// The search field of the palette
const combobox = () => within(palette()).getByRole("combobox", { name: "Command palette" });

describe("CommandPalette", () => {
  it("opens with the keyboard shortcut and runs the highlighted command", async () => {
    const { user } = renderApp();

    await user.keyboard("{Control>}k{/Control}");
    expect(combobox()).toHaveFocus();

    await user.type(combobox(), "today");
    const option = within(palette()).getByRole("option", { name: /Go to Today/ });
    expect(option).toHaveAttribute("aria-selected", "true");
    expect(combobox()).toHaveAttribute("aria-activedescendant", option.id);

    await user.keyboard("{Enter}");
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Today" })).toBeInTheDocument();
  });

  it("navigates options with the arrow keys and closes with Escape", async () => {
    const { user, store } = renderApp();

    await user.click(screen.getByRole("button", { name: /^Command palette \(/ }));
    await user.type(combobox(), "sort by");

    const options = within(palette()).getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");
    expect(options[1]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(options.at(-1)).toHaveAttribute("aria-selected", "true");
    expect(options.at(-1)).toHaveTextContent("Search for “sort by”");

    await user.clear(combobox());
    await user.type(combobox(), "sort title");
    await user.keyboard("{Enter}");
    expect(store.getState().view.sort).toBe("alphabetical");

    await user.keyboard("{Control>}k{/Control}");
    expect(palette()).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Command palette" })).not.toBeInTheDocument();
    expect(store.getState().view.overlay).toBeNull();
  });

  it("opens projects and creates new ones", async () => {
    const { user, store } = renderApp([], "all", [makeProject({ id: "home", name: "🏠 Home", color: "orange" })]);

    await user.keyboard("{Control>}k{/Control}");
    await user.type(combobox(), "home");
    await user.keyboard("{Enter}");
    expect(store.getState().view.list).toBe("project:home");
    expect(screen.getByRole("heading", { level: 1, name: "Home" })).toBeInTheDocument();

    await user.keyboard("{Control>}k{/Control}");
    await user.type(combobox(), "new project");
    await user.keyboard("{Enter}");
    expect(screen.getByRole("dialog", { name: "New project" })).toBeInTheDocument();
  });

  it("finds tasks and opens their details", async () => {
    const { user } = renderApp([makeTask({ id: "trip", title: "Plan the trip", notes: "Book hotel" })]);

    await user.keyboard("{Meta>}k{/Meta}");
    await user.type(combobox(), "hotel");
    await user.click(within(palette()).getByRole("option", { name: /Plan the trip/ }));

    expect(screen.getByRole("dialog", { name: "Task details" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue("Book hotel");
  });

  it("changes settings and searches for the typed text", async () => {
    const { user, store } = renderApp();

    await user.keyboard("{Control>}k{/Control}");
    await user.type(combobox(), "українська");
    await user.keyboard("{Enter}");
    expect(store.getState().settings.locale).toBe("uk");

    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog", { name: "Палітра команд" })).toBeInTheDocument();
    await user.type(screen.getByRole("combobox"), "grandma");
    await user.click(screen.getByRole("option", { name: /Шукати «grandma»/ }));
    expect(store.getState().view.query).toBe("grandma");
  });

  it("explains when nothing matches", async () => {
    const { user } = renderApp();

    await user.keyboard("{Control>}k{/Control}");
    await user.type(combobox(), "qqqq");

    expect(within(palette()).getByText("Nothing matches “qqqq”")).toBeInTheDocument();
    expect(within(palette()).getByText("1 result")).toBeInTheDocument();
    expect(within(palette()).getByRole("option")).toHaveTextContent("Search for “qqqq”");
  });
});
