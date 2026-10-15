import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { selectList, selectQuery } from "@/features/lists/model/selectors";
import { makeProject, makeState, makeTask } from "@/test/factories";
import { renderWithStore } from "@/test/render";

import TaskMeta from "./TaskMeta";

const TODAY = "2026-06-15";
const work = makeProject({ id: "work", name: "Work" });

// Renders the chips of a task in a store that knows the project
const renderMeta = (task: Parameters<typeof makeTask>[0], options: { hideDueDate?: boolean; shown?: boolean } = {}) =>
  renderWithStore(
    <TaskMeta
      task={makeTask(task)}
      today={TODAY}
      hideDueDate={options.hideDueDate ?? false}
      project={options.shown ? work : undefined}
    />,
    { preloadedState: makeState([], "all", "", [work]) },
  );

describe("TaskMeta", () => {
  it("renders nothing for a plain task", () => {
    const { container } = renderMeta({ id: "a", title: "Plain" });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the due date, the repeat, the checklist and the notes", () => {
    renderMeta({
      id: "a",
      title: "Standup",
      dueDate: TODAY,
      repeat: "weekly",
      notes: "Room 4",
      subtasks: [
        { id: "s1", title: "Agenda", completed: true },
        { id: "s2", title: "Notes", completed: true },
      ],
    });
    expect(screen.getByText("Today").closest("span")).toHaveAttribute("data-tone", "today");
    expect(screen.getByText("Repeat: Every week")).toBeInTheDocument();
    expect(screen.getByText("2 of 2 subtasks").closest("span[data-tone]")).toHaveAttribute("data-tone", "done");
    expect(screen.getByText("Has notes")).toBeInTheDocument();
  });

  it("keeps a finished task calm and can hide the date", () => {
    const { unmount } = renderMeta({ id: "a", title: "Done", dueDate: "2026-06-10", completed: true });
    expect(screen.getByRole("time").parentElement).not.toHaveAttribute("data-tone");
    unmount();
    const { container } = renderMeta({ id: "b", title: "Hidden", dueDate: TODAY }, { hideDueDate: true });
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the project and searches a tag", async () => {
    const { store, user } = renderMeta({ id: "a", title: "Report", tags: ["#q3"] }, { shown: true });
    await user.click(screen.getByRole("button", { name: "Open Work" }));
    expect(selectList(store.getState())).toBe("project:work");
    await user.click(screen.getByRole("button", { name: "Show tasks tagged #q3" }));
    expect(selectQuery(store.getState())).toBe("#q3");
  });
});
