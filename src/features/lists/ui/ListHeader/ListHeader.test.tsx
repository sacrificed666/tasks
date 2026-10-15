import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeProject, makeState, makeTask, todayKey } from "@/test/factories";
import { renderWithStore } from "@/test/render";

import ListHeader from "./ListHeader";

const project = makeProject({ id: "work", name: "Work" });
const tasks = [
  makeTask({ id: "a", title: "Send the invoice", dueDate: todayKey(), projectId: "work" }),
  makeTask({ id: "b", title: "Book flights", dueDate: todayKey(), completed: true, completedAt: Date.now() }),
  makeTask({ id: "c", title: "Read a book" }),
];

describe("ListHeader", () => {
  it("names the list and shows how much of it is done", () => {
    renderWithStore(<ListHeader />, { preloadedState: makeState(tasks, "today") });
    expect(screen.getByRole("heading", { level: 1, name: "Today" })).toBeInTheDocument();
    expect(screen.getByText("1 of 2 done")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Today progress" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Sort tasks/u })).toBeInTheDocument();
  });

  it("leaves the progress out of upcoming and completed tasks", () => {
    renderWithStore(<ListHeader />, { preloadedState: makeState(tasks, "completed") });
    expect(screen.getByRole("heading", { level: 1, name: "Completed" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("offers to edit the open project", async () => {
    const { store, user } = renderWithStore(<ListHeader />, {
      preloadedState: makeState(tasks, "project:work", "", [project]),
    });
    expect(screen.getByRole("heading", { level: 1, name: "Work" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit project" }));
    expect(store.getState().view.overlay).toEqual({ kind: "project", projectId: "work" });
  });

  it("announces search results and clears the search", async () => {
    const { store, user } = renderWithStore(<ListHeader />, { preloadedState: makeState(tasks, "all", "book") });
    expect(screen.getByRole("status")).toHaveTextContent("2 results for “book”");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(store.getState().view.query).toBe("");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
