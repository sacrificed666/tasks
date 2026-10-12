import { DndContext } from "@dnd-kit/core";
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeProject, makeState, makeTask } from "@/test/factories";
import { renderWithStore } from "@/test/render";

import ProjectNav from "./ProjectNav";

const projects = [
  makeProject({ id: "work", name: "Work" }),
  makeProject({ id: "home", name: "🏠 Home", color: "green" }),
];
const tasks = [
  makeTask({ id: "a", title: "Send the invoice", projectId: "work" }),
  makeTask({ id: "b", title: "Water the plants", projectId: "home" }),
  makeTask({ id: "c", title: "Fix the tap", projectId: "home" }),
];

// The project names in the order of the sidebar
const order = () =>
  within(screen.getByRole("navigation", { name: "Projects" }))
    .getAllByRole("button", { name: /\(\d+\)$/u })
    .map((button) => button.getAttribute("aria-label"));

describe("ProjectNav", () => {
  it("lists the projects with their counts and opens one", async () => {
    const onNavigate = vi.fn<() => void>();
    const { store, user } = renderWithStore(
      <DndContext>
        <ProjectNav onNavigate={onNavigate} />
      </DndContext>,
      { preloadedState: makeState(tasks, "project:home", "", projects) },
    );
    expect(order()).toEqual(["Work (1)", "Home (2)"]);
    expect(screen.getByRole("button", { name: "Home (2)" })).toHaveAttribute("aria-current", "page");
    await user.click(screen.getByRole("button", { name: "Work (1)" }));
    expect(store.getState().view.list).toBe("project:work");
    expect(onNavigate).toHaveBeenCalledOnce();
  });

  it("moves a project with Alt and an arrow key and keeps the focus", async () => {
    const { user } = renderWithStore(
      <DndContext>
        <ProjectNav />
      </DndContext>,
      { preloadedState: makeState(tasks, "all", "", projects) },
    );
    const work = screen.getByRole("button", { name: "Work (1)" });
    work.focus();
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(order()).toEqual(["Work (1)", "Home (2)"]);
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(order()).toEqual(["Home (2)", "Work (1)"]);
    expect(screen.getByRole("button", { name: "Work (1)" })).toHaveFocus();
  });

  it("explains projects before there are any and creates one", async () => {
    const { store, user } = renderWithStore(
      <DndContext>
        <ProjectNav />
      </DndContext>,
      { preloadedState: makeState([], "all") },
    );
    expect(screen.getByText("Group tasks into projects like Work or 🏠 Home.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "New project" }));
    expect(store.getState().view.overlay).toEqual({ kind: "project", projectId: null });
  });
});
