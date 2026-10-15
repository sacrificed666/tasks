import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { selectTasks } from "@/features/tasks/model/selectors";
import { makeTask } from "@/test/factories";
import { renderApp } from "@/test/render";

const trip = makeTask({
  id: "trip",
  title: "Trip",
  subtasks: [
    { id: "s1", title: "Passport", completed: false },
    { id: "s2", title: "Tickets", completed: true },
    { id: "s3", title: "Charger", completed: false },
  ],
});

// Opens the details of the trip and returns its subtasks
const openDetails = async (user: ReturnType<typeof renderApp>["user"]) => {
  await user.click(screen.getByRole("button", { name: "Details for “Trip”" }));
  return within(screen.getByRole("region", { name: "Subtasks" }));
};

// The subtask titles of the first task in the store
const subtaskTitles = (store: ReturnType<typeof renderApp>["store"]) =>
  selectTasks(store.getState())[0]?.subtasks.map((subtask) => subtask.title);

describe("SubtaskList", () => {
  it("shows the progress and ticks subtasks off", async () => {
    const { user, store } = renderApp([trip]);
    const list = await openDetails(user);
    expect(list.getByText("1 of 3 subtasks")).toBeInTheDocument();
    await user.click(list.getByRole("checkbox", { name: "Passport" }));
    expect(selectTasks(store.getState())[0]?.subtasks[0]?.completed).toBe(true);
    expect(list.getByText("2 of 3 subtasks")).toBeInTheDocument();
  });

  it("renames a subtask in place and removes it when emptied", async () => {
    const { user, store } = renderApp([trip]);
    const list = await openDetails(user);
    const first = list.getByRole("textbox", { name: "Subtask 1" });
    await user.clear(first);
    await user.type(first, "Passports{Enter}");
    expect(subtaskTitles(store)).toEqual(["Passports", "Tickets", "Charger"]);

    const last = list.getByRole("textbox", { name: "Subtask 3" });
    await user.clear(last);
    await user.keyboard("{Backspace}");
    expect(subtaskTitles(store)).toEqual(["Passports", "Tickets"]);
  });

  it("deletes a subtask with its button and reorders with Alt and the arrow keys", async () => {
    const { user, store } = renderApp([trip]);
    const list = await openDetails(user);
    await user.click(list.getByRole("button", { name: "Delete subtask “Tickets”" }));
    expect(subtaskTitles(store)).toEqual(["Passport", "Charger"]);
    await waitFor(() => expect(list.getByRole("textbox", { name: "Subtask 1" })).toHaveFocus());

    await user.click(list.getByRole("textbox", { name: "Subtask 2" }));
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(subtaskTitles(store)).toEqual(["Charger", "Passport"]);
  });

  it("adds subtasks one after another and can undo them", async () => {
    const { user, store } = renderApp([makeTask({ id: "trip", title: "Trip" })]);
    const list = await openDetails(user);
    expect(list.queryByRole("list")).not.toBeInTheDocument();
    const add = list.getByRole("textbox", { name: "Add a subtask" });
    await user.type(add, "Passport{Enter}Tickets{Enter}");
    expect(subtaskTitles(store)).toEqual(["Passport", "Tickets"]);
    expect(add).toHaveValue("");
    expect(add).toHaveFocus();
    expect(store.getState().history.past.at(-1)?.description).toEqual({
      key: "history.subtaskAdded",
      params: { title: "Tickets" },
    });
  });
});
