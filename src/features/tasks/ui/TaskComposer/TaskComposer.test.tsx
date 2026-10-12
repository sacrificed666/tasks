import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { selectTasks } from "@/features/tasks/model/selectors";
import { dayFromToday, makeTask } from "@/test/factories";
import { openPopover, renderApp } from "@/test/render";

describe("TaskComposer quick add", () => {
  it("recognises dates, importance and tags while typing", async () => {
    const { user, store } = renderApp([]);
    const input = screen.getByRole("textbox", { name: "New task" });

    await user.type(input, "Call the plumber tomorrow !");

    expect(screen.getByRole("button", { name: "Due date: Tomorrow" })).toHaveAttribute(
      "title",
      "Recognised from the title",
    );
    expect(screen.getByRole("button", { name: "Important" })).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Enter}");

    expect(selectTasks(store.getState())[0]).toMatchObject({
      title: "Call the plumber",
      dueDate: dayFromToday(1),
      important: true,
    });
    expect(screen.getByRole("button", { name: "Important" })).toHaveAttribute("aria-pressed", "false");
  });

  it("understands Ukrainian phrases and turns hashtags into tags", async () => {
    const { user, store } = renderApp([]);

    await user.type(screen.getByRole("textbox", { name: "New task" }), "Купити квіти #дім через 3 дні");
    expect(screen.getByRole("button", { name: "Tags: #дім" })).toHaveAttribute("title", "Recognised from the title");
    await user.keyboard("{Enter}");

    expect(selectTasks(store.getState())[0]).toMatchObject({
      title: "Купити квіти",
      tags: ["#дім"],
      dueDate: dayFromToday(3),
    });
  });

  it("adds the tags picked in the composer", async () => {
    const { user, store } = renderApp([makeTask({ id: "old", title: "Old", tags: ["#home"] })]);

    const picker = await openPopover(user, screen.getByRole("button", { name: "Tags" }));
    await user.click(picker.getByRole("button", { name: "home" }));
    await user.type(screen.getByRole("textbox", { name: "New task" }), "Water the plants{Enter}");

    expect(selectTasks(store.getState()).find((task) => task.title === "Water the plants")?.tags).toEqual(["#home"]);
  });

  it("lets a recognised date override the picker only while it is typed", async () => {
    const { user } = renderApp([], "today");
    const input = screen.getByRole("textbox", { name: "New task" });

    expect(screen.getByRole("button", { name: "Due date: Today" })).toBeInTheDocument();
    await user.type(input, "Report next week");
    expect(screen.getByRole("button", { name: /^Due date: / })).not.toHaveAccessibleName("Due date: Today");

    await user.clear(input);
    expect(screen.getByRole("button", { name: "Due date: Today" })).toBeInTheDocument();
  });
});

// The quick add form
const composer = () => screen.getByRole("textbox", { name: "New task" }).closest("form");

describe("TaskComposer options row", () => {
  it("opens while the field is in use and closes when the user leaves it", async () => {
    const { user } = renderApp([]);
    expect(composer()).not.toHaveAttribute("data-engaged");

    await user.click(screen.getByRole("textbox", { name: "New task" }));
    expect(composer()).toHaveAttribute("data-engaged");

    await user.click(screen.getByRole("button", { name: "Important" }));
    expect(composer()).toHaveAttribute("data-engaged");

    await user.click(screen.getByRole("heading", { level: 1 }));
    expect(composer()).not.toHaveAttribute("data-engaged");
  });

  it("stays open while there is text and after focus moves elsewhere with the keyboard", async () => {
    const { user } = renderApp([]);

    await user.type(screen.getByRole("textbox", { name: "New task" }), "Draft");
    await user.click(screen.getByRole("heading", { level: 1 }));
    expect(composer()).toHaveAttribute("data-engaged");

    await user.clear(screen.getByRole("textbox", { name: "New task" }));
    await user.tab({ shift: true });
    expect(composer()).not.toHaveAttribute("data-engaged");
  });
});

describe("TaskComposer keyboard", () => {
  it("clears the text with Escape and leaves the field on the second press", async () => {
    const { user } = renderApp([]);
    const input = screen.getByRole("textbox", { name: "New task" });

    await user.type(input, "Half-written task");
    await user.keyboard("{Escape}");
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(input).not.toHaveFocus();
    expect(composer()).not.toHaveAttribute("data-engaged");
  });
});
