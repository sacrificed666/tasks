import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { selectTasks } from "@/features/tasks/model/selectors";
import { makeTask, sampleTasks } from "@/test/factories";
import { openPopover, renderApp } from "@/test/render";

// The task details dialog
const details = () => screen.getByRole("dialog", { name: "Task details" });

describe("TaskDetailsDialog", () => {
  it("edits the title, notes and subtasks and shows their progress", async () => {
    const { user, store } = renderApp();

    await user.click(screen.getByRole("button", { name: "Details for “Buy milk”" }));
    const dialog = within(details());
    expect(dialog.getByText(/^Created /)).toBeInTheDocument();

    const title = dialog.getByRole("textbox", { name: "Title" });
    await user.clear(title);
    await user.type(title, "Buy oat milk{Enter}");

    const notes = dialog.getByRole("textbox", { name: "Notes" });
    await user.type(notes, "From the market");
    await user.tab();

    const add = dialog.getByRole("textbox", { name: "Add a subtask" });
    await user.type(add, "Oat milk{Enter}Bread{Enter}");
    expect(selectTasks(store.getState())[0]).toMatchObject({
      title: "Buy oat milk",
      notes: "From the market",
      subtasks: [
        { title: "Oat milk", completed: false },
        { title: "Bread", completed: false },
      ],
    });

    await user.click(dialog.getByRole("checkbox", { name: "Oat milk" }));
    await user.click(dialog.getByRole("checkbox", { name: "Bread" }));
    expect(selectTasks(store.getState())[0]?.subtasks.every((subtask) => subtask.completed)).toBe(true);
    expect(dialog.getByText("2 of 2 subtasks")).toBeInTheDocument();
    expect(dialog.getByText(/^Updated /)).toBeInTheDocument();

    await user.click(dialog.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Task details" })).not.toBeInTheDocument();
    expect(screen.getByText("2 of 2 subtasks")).toBeInTheDocument();
  });

  it("completes, stars and schedules the task", async () => {
    const { user, store } = renderApp();

    await user.click(screen.getByRole("button", { name: "Details for “Call grandma”" }));
    const dialog = within(details());

    await user.click(dialog.getByRole("button", { name: "Important", pressed: false }));
    const picker = await openPopover(user, dialog.getByRole("button", { name: "Due date" }));
    await user.click(picker.getByRole("button", { name: /Tomorrow/ }));
    await user.click(dialog.getByRole("checkbox", { name: "Completed" }));

    expect(selectTasks(store.getState()).find((task) => task.id === "call")).toMatchObject({
      important: true,
      completed: true,
    });
    expect(dialog.getByText(/^Completed /)).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: /^Due date: / })).toBeInTheDocument();
  });

  it("duplicates and deletes tasks", async () => {
    const { user, store } = renderApp();

    await user.click(screen.getByRole("button", { name: "Details for “Buy milk”" }));
    await user.click(within(details()).getByRole("button", { name: "Duplicate" }));
    expect(selectTasks(store.getState()).map((task) => task.title)).toEqual([
      "Buy milk",
      "Buy milk",
      "Write the quarterly report",
      "Call grandma",
    ]);
    expect(screen.getByRole("status", { name: "Notification" })).toHaveTextContent("Duplicated “Buy milk”");

    await user.click(screen.getByRole("button", { name: "Details for “Call grandma”" }));
    await user.click(within(details()).getByRole("button", { name: "Delete" }));
    expect(screen.queryByText("Call grandma")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Notification" })).toHaveTextContent("Deleted “Call grandma”");
  });

  it("picks, creates and removes tags and closes with Escape", async () => {
    const { user, store } = renderApp([...sampleTasks, makeTask({ id: "tagged", title: "Slides", tags: ["#work"] })]);

    await user.click(screen.getByRole("button", { name: "Details for “Slides”" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Task details" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Details for “Slides”" }));
    const picker = await openPopover(user, within(details()).getByRole("button", { name: "Tags: #work" }));
    await user.type(picker.getByRole("textbox", { name: "Find or create a tag" }), "q4{Enter}");
    expect(store.getState().tasks.entities.tagged?.tags).toEqual(["#work", "#q4"]);
    await user.click(picker.getByRole("button", { name: "work" }));
    expect(store.getState().tasks.entities.tagged?.tags).toEqual(["#q4"]);

    await user.clear(within(details()).getByRole("textbox", { name: "Title" }));
    await user.type(within(details()).getByRole("textbox", { name: "Title" }), "Slides for Q4 #talk{Enter}");
    expect(store.getState().tasks.entities.tagged).toMatchObject({
      title: "Slides for Q4",
      tags: ["#q4", "#talk"],
    });
    expect(within(details()).getByRole("textbox", { name: "Title" })).toHaveValue("Slides for Q4");
  });
});
