import { act, fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TOAST_DURATION } from "@/features/notifications/ui/Toaster/Toaster";
import { selectTasks } from "@/features/tasks/model/selectors";
import { parseTasks } from "@/features/tasks/model/task";
import { COMPACT_LAYOUT, WIDE_LAYOUT } from "@/shared/lib/media";
import { dayFromToday, makeProject, makeTask, todayKey } from "@/test/factories";
import { itemTitles, mockMediaQueries, openPopover, renderApp, section, type User } from "@/test/render";

// The toast on screen
const notification = () => screen.getByRole("status", { name: "Notification" });

// Opens the settings from the toolbar
const openSettings = async (user: User) => {
  await user.click(screen.getByRole("button", { name: "Settings" }));
  return within(screen.getByRole("dialog", { name: "Settings" }));
};

// Picks an entry of the actions menu, which then closes
const chooseMenuItem = async (user: User, name: string) => {
  const menu = await openPopover(user, screen.getByRole("button", { name: "More actions" }));
  await user.click(menu.getByRole("button", { name }));
  expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
};

const plannedTasks = [
  makeTask({ id: "late", title: "Send the invoice", dueDate: dayFromToday(-2), important: true }),
  makeTask({ id: "now", title: "Daily standup", dueDate: todayKey() }),
  makeTask({ id: "soon", title: "Dentist appointment", dueDate: dayFromToday(3) }),
  makeTask({ id: "free", title: "Read a book" }),
];

describe("App shell", () => {
  it("keeps the header, search and lists in the sidebar and the credits in a footer", () => {
    renderApp(plannedTasks);

    const banner = screen.getByRole("banner");
    expect(within(banner).getByRole("link", { name: "Tasks, home page" })).toHaveTextContent("Tasks");
    expect(within(banner).getByRole("searchbox", { name: "Search tasks" })).toHaveAttribute("aria-keyshortcuts", "/");
    expect(within(banner).getByRole("navigation", { name: "Projects" })).toBeInTheDocument();
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByRole("link", { name: /^Source code/ })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: /^v1\.0\.0/ })).toHaveAttribute(
      "href",
      "https://github.com/sacrificed666/tasks/blob/main/CHANGELOG.md",
    );
    expect(within(footer).queryByRole("link", { name: "Illia Movchko" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "All tasks" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Lists" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Important (1)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Source code/ })).toHaveAttribute(
      "href",
      "https://github.com/sacrificed666/tasks",
    );
  });

  it("switches lists with the navigation and number keys", async () => {
    const { user } = renderApp(plannedTasks);

    await user.click(screen.getByRole("button", { name: /^Today/ }));
    expect(screen.getByRole("heading", { level: 1, name: "Today" })).toBeInTheDocument();
    expect(itemTitles(section(/^Overdue/))).toEqual(["Send the invoice"]);
    expect(itemTitles(section(/^Today/))).toEqual(["Daily standup"]);
    expect(screen.getByRole("button", { name: /^Today/ })).toHaveAttribute("aria-current", "page");

    await user.keyboard("3");
    expect(screen.getByRole("heading", { level: 1, name: "Upcoming" })).toBeInTheDocument();
    expect(itemTitles(screen.getByRole("main"))).toEqual(["Dentist appointment"]);

    await user.keyboard("4");
    expect(itemTitles(section(/^Active/))).toEqual(["Send the invoice"]);
  });

  it("shows list-specific empty states", async () => {
    const { user } = renderApp([]);

    expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Upcoming/ }));
    expect(screen.getByText("Nothing planned")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Completed/ }));
    expect(screen.getByText("Nothing completed yet")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "New task" })).not.toBeInTheDocument();
  });

  it("changes the appearance, accent, background and glass", async () => {
    const { user, store } = renderApp();

    const panel = await openSettings(user);
    await user.click(panel.getByRole("radio", { name: "Light" }));
    await user.click(panel.getByRole("radio", { name: "Forest" }));
    await user.click(panel.getByRole("radio", { name: "Nebula" }));
    await user.click(panel.getByRole("radio", { name: "Tinted" }));

    expect(store.getState().settings).toEqual({
      appearance: "light",
      accent: "forest",
      backdrop: "nebula",
      glass: "tinted",
      locale: "en",
      effects: "auto",
    });
    expect(document.documentElement.dataset).toMatchObject({
      appearance: "light",
      accent: "forest",
      backdrop: "nebula",
      glass: "tinted",
    });

    await user.click(panel.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("switches the interface language", async () => {
    const { user, store } = renderApp(plannedTasks);

    const panel = await openSettings(user);
    await user.click(panel.getByRole("radio", { name: "Українська" }));

    expect(store.getState().settings.locale).toBe("uk");
    expect(document.documentElement.lang).toBe("uk");
    expect(screen.getByRole("heading", { level: 1, name: "Усі завдання" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Сьогодні (2)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Вихідний код/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Нове завдання" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Завдання, головна сторінка" })).toHaveTextContent("Завдання");
    expect(document.title).toBe("Завдання · Приватний планувальник завдань");
  });

  it("names the browser tab after the open list", async () => {
    const { user } = renderApp(plannedTasks);
    expect(document.title).toBe("Tasks · Private task planner");

    await user.click(screen.getByRole("button", { name: /^Today/ }));
    expect(document.title).toBe("Today · Tasks");

    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "dentist");
    expect(document.title).toBe("Search · Tasks");
  });

  it("offers a skip link to the task list", () => {
    renderApp();
    expect(screen.getByRole("link", { name: "Skip to tasks" })).toHaveAttribute("href", "#tasks");
    expect(screen.getByRole("main")).toHaveAttribute("id", "tasks");
  });

  it("uses a bottom tab bar on narrow screens", async () => {
    mockMediaQueries([COMPACT_LAYOUT]);
    const { user } = renderApp(plannedTasks);

    const tabs = screen.getByRole("navigation", { name: "Lists" });
    expect(within(tabs).getByRole("button", { name: "All (4)" })).toHaveAttribute("aria-current", "page");
    expect(within(tabs).getByText("Planned")).toBeInTheDocument();

    await user.click(within(tabs).getByRole("button", { name: "Starred (1)" }));
    expect(screen.getByRole("heading", { level: 1, name: "Important" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
  });
});

describe("Layout", () => {
  it("shows the version once, in the footer", () => {
    renderApp();
    expect(screen.getAllByText(/^v\d+\.\d+\.\d+$/u)).toHaveLength(1);
    expect(within(screen.getByRole("contentinfo")).getByText("v1.0.0")).toBeInTheDocument();
  });

  it("filters by tag from the sidebar", async () => {
    const { user, store } = renderApp([
      makeTask({ id: "a", title: "Slides", tags: ["#work"] }),
      makeTask({ id: "b", title: "Report", tags: ["#work"] }),
      makeTask({ id: "c", title: "Groceries", tags: ["#home"] }),
    ]);

    const tags = screen.getByRole("navigation", { name: "Tags" });
    const work = within(tags).getByRole("button", { name: "Show tasks tagged #work (2)" });
    expect(work).toHaveTextContent("work 2");

    await user.click(work);
    expect(store.getState().view.query).toBe("#work");
    expect(work).toHaveAttribute("aria-pressed", "true");
    expect(itemTitles(section(/^Active/))).toEqual(["Slides", "Report"]);

    await user.click(work);
    expect(store.getState().view.query).toBe("");
  });

  it("shows task details next to the list on wide screens", async () => {
    mockMediaQueries([WIDE_LAYOUT]);
    const { user } = renderApp();

    expect(screen.getByRole("heading", { name: "Overview" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Details for “Buy milk”" }));

    const panel = screen.getByRole("region", { name: "Task details" });
    expect(panel).toHaveFocus();
    expect(screen.queryByRole("dialog", { name: "Task details" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Overview" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Buy milk" }).parentElement).toHaveAttribute("data-selected");

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region", { name: "Task details" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Buy milk" })).toHaveFocus();
  });

  it("switches to any of the ten languages", async () => {
    const { user, store } = renderApp(plannedTasks);

    const panel = await openSettings(user);
    expect(
      panel.getAllByRole("radio", {
        name: /English|Українська|Čeština|Deutsch|Español|Français|Italiano|Nederlands|Polski|Português/,
      }),
    ).toHaveLength(10);
    await user.click(panel.getByRole("radio", { name: "Deutsch" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Alle Aufgaben" })).toBeInTheDocument();
    expect(store.getState().settings.locale).toBe("de");
    expect(document.documentElement.lang).toBe("de");
    expect(screen.getByRole("textbox", { name: "Neue Aufgabe" })).toBeInTheDocument();
  });

  it("switches the effects level", async () => {
    const { user, store } = renderApp();

    const panel = await openSettings(user);
    expect(panel.getByText("On this device: Reduced")).toBeInTheDocument();

    await user.click(panel.getByRole("radio", { name: "Full" }));
    expect(store.getState().settings.effects).toBe("full");
    expect(document.documentElement.dataset.effects).toBe("full");

    await user.click(panel.getByRole("radio", { name: "Reduced" }));
    expect(document.documentElement.dataset.effects).toBe("reduced");
  });
});

describe("Planning", () => {
  it("groups overdue tasks in Today and moves them to today in one step", async () => {
    const { user, store } = renderApp(
      [
        makeTask({ id: "late", title: "Send the invoice", dueDate: dayFromToday(-2) }),
        makeTask({ id: "now", title: "Daily standup", dueDate: todayKey() }),
      ],
      "today",
    );

    const overdue = section(/^Overdue/);
    expect(itemTitles(overdue)).toEqual(["Send the invoice"]);
    await user.click(within(overdue).getByRole("button", { name: "Move to today" }));

    expect(screen.queryByRole("region", { name: /^Overdue/ })).not.toBeInTheDocument();
    expect(selectTasks(store.getState()).map((task) => task.dueDate)).toEqual([todayKey(), todayKey()]);
    expect(notification()).toHaveTextContent("Moved 1 task to today");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(selectTasks(store.getState())[0]?.dueDate).toBe(dayFromToday(-2));
  });

  it("groups Upcoming by day without repeating the date on every row", () => {
    renderApp(
      [
        makeTask({ id: "a", title: "Dentist appointment", dueDate: dayFromToday(1) }),
        makeTask({ id: "b", title: "Book flights", dueDate: dayFromToday(1) }),
        makeTask({ id: "c", title: "Plan the holidays", dueDate: dayFromToday(30) }),
      ],
      "upcoming",
    );

    const tomorrow = section(/^Tomorrow/);
    expect(itemTitles(tomorrow)).toEqual(["Dentist appointment", "Book flights"]);
    expect(within(tomorrow).queryByText("Tomorrow", { ignore: "h2, [popover] *" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("main")).getAllByRole("region")).toHaveLength(2);
  });

  it("stays in the current list and offers to show a task added elsewhere", async () => {
    const { user } = renderApp([], "today");

    await user.type(screen.getByRole("textbox", { name: "New task" }), "Call mom in 3 days{Enter}");

    expect(screen.getByRole("heading", { level: 1, name: "Today" })).toBeInTheDocument();
    expect(notification()).toHaveTextContent("Added “Call mom” to Upcoming");

    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByRole("heading", { level: 1, name: "Upcoming" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Call mom" })).toHaveFocus();
  });

  it("repeats tasks set up in the details", async () => {
    const { user, store } = renderApp([makeTask({ id: "plants", title: "Water the plants", dueDate: todayKey() })]);

    await user.click(screen.getByRole("button", { name: "Details for “Water the plants”" }));
    const repeat = await openPopover(user, screen.getByRole("button", { name: "Repeat" }));
    await user.click(repeat.getByRole("button", { name: "Every week" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("Repeat: Every week")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: "Water the plants" }));

    const tasks = selectTasks(store.getState());
    expect(tasks).toHaveLength(2);
    expect(tasks.find((task) => !task.completed)).toMatchObject({ dueDate: dayFromToday(7), repeat: "weekly" });
  });

  it("explains the overview and hides empty counters while there are no tasks", () => {
    renderApp([]);
    expect(screen.getByText("Add a few tasks to see your progress here.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today (0)" })).toHaveTextContent(/^Today$/);
  });
});

describe("Composer", () => {
  it("adds tasks", async () => {
    const { user } = renderApp([]);
    const input = screen.getByRole("textbox", { name: "New task" });
    const submit = screen.getByRole("button", { name: "Add task" });

    expect(submit).toBeDisabled();
    await user.type(input, "   ");
    expect(submit).toBeDisabled();

    await user.clear(input);
    await user.type(input, "  Water   the plants {Enter}");
    await user.type(input, "Feed the cat");
    await user.click(submit);

    expect(input).toHaveValue("");
    expect(itemTitles(section(/^Active/))).toEqual(["Feed the cat", "Water the plants"]);
  });

  it("sets a due date and importance for new tasks", async () => {
    const { user, store } = renderApp([]);

    const picker = await openPopover(user, screen.getByRole("button", { name: "Due date" }));
    await user.click(picker.getByRole("button", { name: /Tomorrow/ }));
    await user.click(screen.getByRole("button", { name: "Important", pressed: false }));
    await user.type(screen.getByRole("textbox", { name: "New task" }), "Renew passport{Enter}");

    expect(selectTasks(store.getState())[0]).toMatchObject({
      title: "Renew passport",
      dueDate: dayFromToday(1),
      important: true,
    });
    expect(within(section(/^Active/)).getByText("Tomorrow", { ignore: "[popover] *" })).toBeInTheDocument();
  });

  it("uses the defaults of the selected list", async () => {
    const { user, store } = renderApp([], "today");

    expect(screen.getByRole("button", { name: "Due date: Today" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "New task" }), "Stretch{Enter}");
    expect(selectTasks(store.getState())[0]?.dueDate).toBe(todayKey());

    await user.click(screen.getByRole("button", { name: "Important (0)" }));
    expect(screen.getByRole("button", { name: "Important", pressed: true })).toBeInTheDocument();
  });

  it("focuses the composer with the N shortcut", async () => {
    const { user } = renderApp();
    await user.keyboard("n");
    expect(screen.getByRole("textbox", { name: "New task" })).toHaveFocus();
  });
});

describe("Tasks", () => {
  it("moves completed tasks between sections", async () => {
    const { user } = renderApp();

    await user.click(screen.getByRole("checkbox", { name: "Buy milk" }));

    expect(itemTitles(section(/^Active/))).toEqual(["Call grandma"]);
    expect(itemTitles(section(/^Completed/))).toEqual(["Buy milk", "Write the quarterly report"]);
    expect(screen.getByRole("checkbox", { name: "Buy milk" })).toHaveFocus();
  });

  it("edits a task inline", async () => {
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: "Edit “Buy milk”" }));
    const editor = screen.getByRole("textbox", { name: "Task title" });
    expect(editor).toHaveFocus();

    await user.clear(editor);
    await user.type(editor, "Buy oat milk{Enter}");

    expect(screen.getByRole("button", { name: "Edit “Buy oat milk”" })).toHaveFocus();
  });

  it("cancels editing and keeps the title for blank input", async () => {
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: "Edit “Call grandma”" }));
    await user.type(screen.getByRole("textbox", { name: "Task title" }), " and grandpa{Escape}");
    expect(screen.getByText("Call grandma")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit “Call grandma”" }));
    await user.clear(screen.getByRole("textbox", { name: "Task title" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(screen.getByText("Call grandma")).toBeInTheDocument();
  });

  it("marks tasks as important and schedules them", async () => {
    const { user, store } = renderApp();

    await user.click(screen.getByRole("button", { name: "Mark “Buy milk” as important" }));
    expect(screen.getByRole("button", { name: "Mark “Buy milk” as important" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Important (1)" })).toBeInTheDocument();

    const picker = await openPopover(user, screen.getByRole("button", { name: "Set due date for “Buy milk”" }));
    await user.click(picker.getByRole("button", { name: /Next week/ }));
    expect(selectTasks(store.getState())[0]?.dueDate).toBe(dayFromToday(7));

    const again = await openPopover(user, screen.getByRole("button", { name: "Set due date for “Buy milk”" }));
    await user.click(again.getByRole("button", { name: "Remove date" }));
    expect(selectTasks(store.getState())[0]?.dueDate).toBeNull();
  });

  it("removes tasks that leave the current list", async () => {
    const { user } = renderApp(plannedTasks, "important");

    await user.click(screen.getByRole("button", { name: "Mark “Send the invoice” as important" }));
    expect(screen.getByText("No important tasks")).toBeInTheDocument();
  });

  it("deletes a task and restores it with undo", async () => {
    const { user, store } = renderApp();

    await user.click(screen.getByRole("button", { name: "Delete “Buy milk”" }));

    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
    expect(notification()).toHaveTextContent("Deleted “Buy milk”");

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(selectTasks(store.getState()).map((task) => task.id)).toEqual(["milk", "report", "call"]);
    expect(screen.getByRole("checkbox", { name: "Buy milk" })).toHaveFocus();
  });

  it("supports the undo keyboard shortcut", async () => {
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: "Delete “Call grandma”" }));
    await user.keyboard("{Control>}z{/Control}");

    expect(screen.getByText("Call grandma")).toBeInTheDocument();
  });

  it("dismisses notifications automatically", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: "Delete “Buy milk”" }));
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(TOAST_DURATION);
    });

    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("collapses and clears the completed section", async () => {
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: /Completed1/ }));
    expect(screen.queryByRole("checkbox", { name: "Write the quarterly report" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Completed1/ }));
    expect(screen.getByRole("checkbox", { name: "Write the quarterly report" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(notification()).toHaveTextContent("Cleared 1 completed task");
    expect(screen.queryByRole("region", { name: /^Completed/ })).not.toBeInTheDocument();
  });
});

describe("Sorting and search", () => {
  it("sorts tasks and disables manual reordering", async () => {
    const { user } = renderApp(plannedTasks);

    expect(screen.getAllByRole("button", { name: /^Reorder/ })).toHaveLength(4);

    const menu = await openPopover(user, screen.getByRole("button", { name: "Sort tasks: Manual" }));
    await user.click(menu.getByRole("button", { name: "Title A-Z" }));

    expect(itemTitles(section(/^Active/))).toEqual([
      "Daily standup",
      "Dentist appointment",
      "Read a book",
      "Send the invoice",
    ]);
    expect(screen.queryByRole("button", { name: /^Reorder/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort tasks: Title A-Z" })).toBeInTheDocument();
  });

  it("searches tasks with the slash shortcut", async () => {
    const { user } = renderApp();

    await user.keyboard("/");
    const search = screen.getByRole("searchbox", { name: "Search tasks" });
    expect(search).toHaveFocus();

    await user.type(search, "GRAND");
    expect(itemTitles(section(/^Active/))).toEqual(["Call grandma"]);

    await user.clear(search);
    await user.type(search, "zebra");
    expect(screen.getByText("No results")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(search).toHaveValue("");

    await user.keyboard("{Escape}");
    expect(search).not.toHaveFocus();
  });

  it("searches every list, not only the open one", async () => {
    const { user } = renderApp(plannedTasks, "today");

    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "dentist");

    expect(screen.getByRole("heading", { level: 1, name: "Search" })).toBeInTheDocument();
    expect(screen.getByText("1 result for “dentist”", { selector: "output" })).toBeInTheDocument();
    expect(itemTitles(screen.getByRole("main"))).toEqual(["Dentist appointment"]);
    expect(screen.queryByRole("textbox", { name: "New task" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Upcoming/ }));
    expect(screen.getByRole("searchbox", { name: "Search tasks" })).toHaveValue("");
    expect(screen.getByRole("heading", { level: 1, name: "Upcoming" })).toBeInTheDocument();
  });

  it("opens search from the toolbar on phones", async () => {
    mockMediaQueries([COMPACT_LAYOUT]);
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: "Show search" }));
    const search = screen.getByRole("searchbox", { name: "Search tasks" });
    expect(search).toHaveFocus();

    await user.type(search, "milk");
    expect(itemTitles(screen.getByRole("main"))).toEqual(["Buy milk"]);
    expect(screen.getByRole("navigation", { name: "Lists" })).toHaveAttribute("data-idle");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("searchbox", { name: "Search tasks" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show search" })).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Show search" }));
    await user.type(screen.getByRole("searchbox", { name: "Search tasks" }), "call");
    await user.click(within(screen.getByRole("navigation", { name: "Lists" })).getByRole("button", { name: /^Today/ }));
    expect(screen.queryByRole("searchbox", { name: "Search tasks" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Today" })).toBeInTheDocument();
  });
});

describe("More actions menu", () => {
  it("runs bulk actions", async () => {
    const { user } = renderApp();

    await chooseMenuItem(user, "Complete all");
    expect(screen.queryByRole("region", { name: /^Active/ })).not.toBeInTheDocument();
    expect(screen.getByText("All done")).toBeInTheDocument();

    await chooseMenuItem(user, "Mark all as active");
    expect(screen.queryByRole("region", { name: /^Completed/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Buy milk" }));
    await chooseMenuItem(user, "Clear completed");
    expect(notification()).toHaveTextContent("Cleared 1 completed task");
    expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
  });

  it("exports tasks as a JSON file", async () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:tasks");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn<(url: string) => void>() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { user } = renderApp();

    await chooseMenuItem(user, "Export tasks");

    expect(click).toHaveBeenCalledOnce();
    expect(click.mock.contexts[0]).toHaveProperty("download", expect.stringMatching(/^tasks-\d{4}-\d{2}-\d{2}\.json$/));

    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(parseTasks(JSON.parse((await blob?.text()) ?? "null"))).toHaveLength(3);
  });

  it("imports tasks from a JSON file", async () => {
    const { user } = renderApp([]);
    const file = new File(
      [JSON.stringify({ tasks: [{ id: "1", title: "Imported", completed: false }] })],
      "tasks.json",
      {
        type: "application/json",
      },
    );

    await user.upload(screen.getByLabelText("Import tasks from a JSON file"), file);

    expect(await screen.findByRole("checkbox", { name: "Imported" })).toBeInTheDocument();
    expect(notification()).toHaveTextContent("Imported 1 task");
  });
});

describe("Projects", () => {
  const work = makeProject({ id: "work", name: "Work", color: "violet" });

  it("creates a project from the sidebar and adds tasks to it", async () => {
    const { user, store } = renderApp([]);

    await user.click(screen.getByRole("button", { name: "New project" }));
    const dialog = within(screen.getByRole("dialog", { name: "New project" }));
    expect(dialog.getByRole("textbox", { name: "Name" })).toHaveFocus();
    await user.type(dialog.getByRole("textbox", { name: "Name" }), "💡 Ideas");
    await user.click(dialog.getByRole("radio", { name: "Teal" }));
    await user.click(dialog.getByRole("button", { name: "Create" }));

    expect(screen.getByRole("heading", { level: 1, name: "Ideas" })).toBeInTheDocument();
    expect(screen.getByText("Nothing in Ideas yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Project: Ideas" })).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "New task" }), "Write a blog post{Enter}");
    expect(itemTitles(screen.getByRole("main"))).toEqual(["Write a blog post"]);

    const [project] = store.getState().projects.ids;
    expect(store.getState().projects.entities[project ?? ""]).toMatchObject({ name: "💡 Ideas", color: "teal" });
    expect(selectTasks(store.getState())[0]?.projectId).toBe(project);
    expect(
      within(screen.getByRole("navigation", { name: "Projects" })).getByRole("button", { name: "Ideas (1)" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("assigns projects with @ in quick add and opens them from a task", async () => {
    const { user, store } = renderApp([], "all", [work]);

    await user.type(screen.getByRole("textbox", { name: "New task" }), "Prepare slides @work");
    expect(screen.getByRole("button", { name: "Project: Work" })).toHaveAttribute("title", "Recognised from the title");
    await user.keyboard("{Enter}");

    expect(selectTasks(store.getState())[0]).toMatchObject({ title: "Prepare slides", projectId: "work" });
    await user.click(screen.getByRole("button", { name: "Open Work" }));
    expect(screen.getByRole("heading", { level: 1, name: "Work" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open Work" })).not.toBeInTheDocument();
  });

  it("moves a task to another project from its details", async () => {
    const { user, store } = renderApp([makeTask({ id: "deck", title: "Slides" })], "all", [work]);

    await user.click(screen.getByRole("button", { name: "Details for “Slides”" }));
    const details = within(screen.getByRole("dialog", { name: "Task details" }));
    const picker = await openPopover(user, details.getByRole("button", { name: "Project" }));
    await user.click(picker.getByRole("button", { name: "Work" }));

    expect(selectTasks(store.getState())[0]?.projectId).toBe("work");
    expect(details.getByRole("button", { name: "Project: Work" })).toBeInTheDocument();
  });

  it("puts a chosen emoji on the project icon and takes it off again", async () => {
    const { user, store } = renderApp([], "all", [makeProject({ id: "home", name: "🏠 Home", color: "orange" })]);

    await user.click(screen.getByRole("button", { name: "New project" }));
    let dialog = within(screen.getByRole("dialog", { name: "New project" }));
    let emoji = await openPopover(user, dialog.getByRole("button", { name: "Choose an emoji" }));
    expect(emoji.getByRole("button", { name: "No emoji" })).toHaveAttribute("aria-pressed", "true");
    await user.click(emoji.getByRole("button", { name: "🚀" }));
    await user.type(dialog.getByRole("textbox", { name: "Name" }), "Launch");
    await user.click(dialog.getByRole("button", { name: "Create" }));

    const launch = Object.values(store.getState().projects.entities).find((project) =>
      project?.name.endsWith("Launch"),
    );
    expect(launch?.name).toBe("🚀 Launch");

    await user.click(
      within(screen.getByRole("navigation", { name: "Projects" })).getByRole("button", { name: /^Home/ }),
    );
    await user.click(screen.getByRole("button", { name: "Edit project" }));
    dialog = within(screen.getByRole("dialog", { name: "Edit project" }));
    expect(dialog.getByRole("textbox", { name: "Name" })).toHaveValue("Home");
    emoji = await openPopover(user, dialog.getByRole("button", { name: "Choose an emoji" }));
    expect(emoji.getByRole("button", { name: "🏠" })).toHaveAttribute("aria-pressed", "true");
    await user.click(emoji.getByRole("button", { name: "No emoji" }));
    await user.click(dialog.getByRole("button", { name: "Save" }));

    expect(store.getState().projects.entities.home?.name).toBe("Home");
  });

  it("edits and deletes a project with undo", async () => {
    const { user, store } = renderApp([makeTask({ id: "deck", title: "Slides", projectId: "work" })], "project:work", [
      work,
    ]);

    await user.click(screen.getByRole("button", { name: "Edit project" }));
    let dialog = within(screen.getByRole("dialog", { name: "Edit project" }));
    await user.clear(dialog.getByRole("textbox", { name: "Name" }));
    await user.type(dialog.getByRole("textbox", { name: "Name" }), "Job");
    await user.click(dialog.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("heading", { level: 1, name: "Job" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit project" }));
    dialog = within(screen.getByRole("dialog", { name: "Edit project" }));
    await user.click(dialog.getByRole("button", { name: "Delete project" }));
    expect(dialog.getByRole("alert")).toHaveTextContent("“Job” and its 1 task will be deleted.");
    await user.click(dialog.getByRole("button", { name: "Delete" }));

    expect(screen.getByRole("heading", { level: 1, name: "All tasks" })).toBeInTheDocument();
    expect(selectTasks(store.getState())).toEqual([]);
    expect(notification()).toHaveTextContent("Deleted “Job” and 1 task");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(store.getState().projects.entities.work?.name).toBe("Job");
    expect(selectTasks(store.getState())[0]?.title).toBe("Slides");
  });

  it("browses lists and projects from a sheet on phones", async () => {
    mockMediaQueries([COMPACT_LAYOUT]);
    const { user } = renderApp([makeTask({ id: "deck", title: "Slides", projectId: "work" })], "all", [work]);

    await user.click(screen.getByRole("button", { name: "Lists" }));
    const sheet = within(screen.getByRole("dialog", { name: "Lists" }));
    expect(sheet.getByRole("button", { name: "Completed (0)" })).toBeInTheDocument();
    await user.click(sheet.getByRole("button", { name: "Work (1)" }));

    expect(screen.queryByRole("dialog", { name: "Lists" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lists" })).toHaveAttribute("aria-current", "page");
  });
});

// A sideways touch swipe that starts on an element
const swipeOn = (element: Element, distance: number) => {
  fireEvent.pointerDown(element, { pointerId: 7, pointerType: "touch", isPrimary: true, clientX: 200, clientY: 300 });
  fireEvent.pointerMove(element, { pointerId: 7, pointerType: "touch", clientX: 200 + distance / 2, clientY: 302 });
  fireEvent.pointerMove(element, { pointerId: 7, pointerType: "touch", clientX: 200 + distance, clientY: 304 });
  fireEvent.pointerUp(element, { pointerId: 7, pointerType: "touch", clientX: 200 + distance, clientY: 304 });
};

// The title of the open list
const pageTitle = () => screen.getByRole("heading", { level: 1 }).textContent;

describe("Swipe navigation", () => {
  it("turns to the next and the previous list on phones, then on to the projects", () => {
    mockMediaQueries([COMPACT_LAYOUT]);
    renderApp([], "important", [makeProject({ id: "work", name: "Work" })]);
    const main = screen.getByRole("main");

    swipeOn(main, -120);
    expect(pageTitle()).toBe("Completed");
    swipeOn(main, -120);
    expect(pageTitle()).toBe("Work");
    swipeOn(main, -120);
    expect(pageTitle()).toBe("Work");
    swipeOn(main, 120);
    swipeOn(main, 120);
    expect(pageTitle()).toBe("Important");
  });

  it("ignores short, vertical and mouse swipes and leaves task rows their own swipes", () => {
    mockMediaQueries([COMPACT_LAYOUT]);
    const { store } = renderApp([makeTask({ id: "milk", title: "Buy milk" })], "all");
    const main = screen.getByRole("main");

    swipeOn(main, -40);
    fireEvent.pointerDown(main, { pointerId: 8, pointerType: "touch", isPrimary: true, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(main, { pointerId: 8, pointerType: "touch", clientX: 190, clientY: 200 });
    fireEvent.pointerMove(main, { pointerId: 8, pointerType: "touch", clientX: 60, clientY: 210 });
    fireEvent.pointerUp(main, { pointerId: 8, pointerType: "touch", clientX: 60, clientY: 210 });
    fireEvent.pointerDown(main, { pointerId: 9, pointerType: "mouse", isPrimary: true, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(main, { pointerId: 9, pointerType: "mouse", clientX: 60, clientY: 100 });
    fireEvent.pointerUp(main, { pointerId: 9, pointerType: "mouse", clientX: 60, clientY: 100 });
    expect(pageTitle()).toBe("All tasks");

    swipeOn(screen.getByRole("checkbox", { name: "Buy milk" }), 160);
    expect(pageTitle()).toBe("All tasks");
    expect(selectTasks(store.getState())[0]?.completed).toBe(true);
  });

  it("keeps wide screens still", () => {
    renderApp([], "all");

    swipeOn(screen.getByRole("main"), -120);
    expect(pageTitle()).toBe("All tasks");
  });
});

// The overlay the app keeps in the history state
const historyMarker = (): unknown => {
  const state: unknown = window.history.state;
  return typeof state === "object" && state !== null && "taskOverlay" in state ? state.taskOverlay : undefined;
};

describe("Back button", () => {
  it("closes an open sheet instead of leaving the app", async () => {
    window.history.replaceState(null, "");
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(historyMarker()).toEqual(expect.any(String));

    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(screen.queryByRole("dialog", { name: "Settings" })).not.toBeInTheDocument();
  });

  it("keeps a sheet opened from the palette", async () => {
    window.history.replaceState(null, "");
    const { user } = renderApp();

    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox", { name: "Command palette" }), "open settings");
    await user.keyboard("{Enter}");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
    });

    expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument();
    expect(historyMarker()).toEqual(expect.any(String));
  });

  it("removes its history entry when a sheet is closed with a button", async () => {
    window.history.replaceState(null, "");
    const { user } = renderApp();

    await user.click(screen.getByRole("button", { name: "Settings" }));
    const opened = historyMarker();
    expect(opened).toEqual(expect.any(String));

    await user.click(screen.getByRole("button", { name: "Close" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(historyMarker()).not.toBe(opened);
  });
});
