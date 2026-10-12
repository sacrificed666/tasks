import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { dayFromToday, makeProject, makeState, makeTask, todayKey } from "@/test/factories";
import { renderWithStore } from "@/test/render";

import type { Task } from "../../model/task";
import TaskMenu, { type TaskMenuActions } from "./TaskMenu";

const projects = [makeProject({ id: "work", name: "Work" }), makeProject({ id: "home", name: "🏠 Home" })];

// Opens the menu of a task with every action recorded
const openMenu = (task: Task) => {
  const actions: TaskMenuActions = {
    toggle: vi.fn<TaskMenuActions["toggle"]>(),
    toggleImportant: vi.fn<TaskMenuActions["toggleImportant"]>(),
    schedule: vi.fn<TaskMenuActions["schedule"]>(),
    moveToProject: vi.fn<TaskMenuActions["moveToProject"]>(),
    rename: vi.fn<TaskMenuActions["rename"]>(),
    openDetails: vi.fn<TaskMenuActions["openDetails"]>(),
    duplicate: vi.fn<TaskMenuActions["duplicate"]>(),
    remove: vi.fn<TaskMenuActions["remove"]>(),
  };
  const onClose = vi.fn<() => void>();
  const view = renderWithStore(
    <TaskMenu task={task} point={{ x: 40, y: 40 }} touch={false} actions={actions} onClose={onClose} />,
    { preloadedState: makeState([task], "all", "", projects) },
  );
  // Shows the menu again for the task as it is after a change
  const update = (next: Task) =>
    view.rerender(<TaskMenu task={next} point={{ x: 40, y: 40 }} touch={false} actions={actions} onClose={onClose} />);
  return { actions, update, ...view };
};

describe("TaskMenu", () => {
  it.each<[string, keyof TaskMenuActions]>([
    ["Complete", "toggle"],
    ["Mark as important", "toggleImportant"],
    ["Rename", "rename"],
    ["Open details", "openDetails"],
    ["Duplicate", "duplicate"],
    ["Delete", "remove"],
  ])("runs %s and closes", async (name, action) => {
    const { actions, user } = openMenu(makeTask({ id: "a", title: "Call mum" }));
    expect(screen.getByRole("menu", { name: "Actions for “Call mum”" })).toBeVisible();
    await user.click(screen.getByRole("menuitem", { name }));
    expect(actions[action]).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("names the opposite actions of a finished, important task with a date", async () => {
    const task = makeTask({ id: "a", title: "Call mum", completed: true, important: true, dueDate: todayKey() });
    const { actions, user } = openMenu(task);
    expect(screen.getByRole("menuitem", { name: "Mark as not done" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Not important" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /^Today,/u })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("menuitem", { name: "Remove date" }));
    expect(actions.schedule).toHaveBeenCalledWith(null);
  });

  it("follows changes of the task while open", () => {
    const task = makeTask({ id: "a", title: "Call mum" });
    const { update } = openMenu(task);
    update({ ...task, title: "Call dad", completed: true, important: true, dueDate: dayFromToday(1) });
    expect(screen.getByRole("menu", { name: "Actions for “Call dad”" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Mark as not done" })).toBeInTheDocument();
    expect(screen.getByRole("menuitemradio", { name: /^Tomorrow,/u })).toHaveAttribute("aria-checked", "true");
    update(task);
    expect(screen.getByRole("menuitem", { name: "Complete" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Remove date" })).not.toBeInTheDocument();
  });

  it("schedules with a quick date", async () => {
    const { actions, user } = openMenu(makeTask({ id: "a", title: "Call mum" }));
    expect(screen.queryByRole("menuitem", { name: "Remove date" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("menuitemradio", { name: /^Tomorrow,/u }));
    expect(actions.schedule).toHaveBeenCalledWith(dayFromToday(1));
  });

  it("schedules with a day of the calendar and goes back", async () => {
    const { actions, user } = openMenu(makeTask({ id: "a", title: "Call mum" }));
    await user.click(screen.getByRole("menuitem", { name: "Pick a date" }));
    await user.click(screen.getByRole("menuitem", { name: "Back" }));
    await user.click(screen.getByRole("menuitem", { name: "Pick a date" }));
    const day = document.querySelector<HTMLButtonElement>(`[data-date="${dayFromToday(2)}"]`);
    if (!day) throw new Error("The day is not in the calendar");
    await user.click(day);
    expect(actions.schedule).toHaveBeenCalledWith(dayFromToday(2));
  });

  it("moves the task to another project", async () => {
    const { actions, user } = openMenu(makeTask({ id: "a", title: "Call mum", projectId: "work" }));
    await user.click(screen.getByRole("menuitem", { name: "Move to project" }));
    expect(screen.getByRole("menuitemradio", { name: "Work" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "No project" })).toHaveAttribute("aria-checked", "false");
    await user.click(screen.getByRole("menuitemradio", { name: "Home" }));
    expect(actions.moveToProject).toHaveBeenCalledWith("home");
  });

  it("follows a project change on the project page", async () => {
    const task = makeTask({ id: "a", title: "Call mum", projectId: "work" });
    const { update, user } = openMenu(task);
    await user.click(screen.getByRole("menuitem", { name: "Move to project" }));
    update({ ...task, projectId: "home" });
    expect(screen.getByRole("menuitemradio", { name: "Home" })).toHaveAttribute("aria-checked", "true");
    await user.click(screen.getByRole("menuitem", { name: "Back" }));
    await user.click(screen.getByRole("menuitem", { name: "Pick a date" }));
    update({ ...task, dueDate: dayFromToday(2) });
    expect(document.querySelector(`[data-date="${dayFromToday(2)}"]`)).toHaveAttribute("aria-pressed", "true");
  });

  it("takes the task out of its project", async () => {
    const { actions, user } = openMenu(makeTask({ id: "a", title: "Call mum", projectId: "work" }));
    await user.click(screen.getByRole("menuitem", { name: "Move to project" }));
    await user.click(screen.getByRole("menuitemradio", { name: "No project" }));
    expect(actions.moveToProject).toHaveBeenCalledWith(null);
  });
});
