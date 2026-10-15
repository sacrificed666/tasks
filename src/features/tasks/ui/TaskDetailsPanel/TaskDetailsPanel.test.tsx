import { act, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { detailsOpened } from "@/features/lists/model/viewSlice";
import { makeState, makeTask } from "@/test/factories";
import { renderWithStore } from "@/test/render";

import { toggleId } from "../ids";
import TaskDetailsPanel from "./TaskDetailsPanel";

const task = makeTask({ id: "a", title: "Call mum" });

// Renders the panel of a task next to a stand-in for its row
const renderPanel = () => {
  const view = renderWithStore(
    <>
      <button type="button" id={toggleId(task.id)}>
        Row of the task
      </button>
      <TaskDetailsPanel task={task} />
    </>,
    { preloadedState: makeState([task]) },
  );
  act(() => {
    view.store.dispatch(detailsOpened(task.id));
  });
  return view;
};

describe("TaskDetailsPanel", () => {
  it("takes the focus and closes with Escape, back on the task's row", async () => {
    const { store, user } = renderPanel();
    expect(screen.getByRole("region", { name: "Task details" })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(store.getState().view.detailsId).toBeNull();
    expect(screen.getByRole("button", { name: "Row of the task" })).toHaveFocus();
  });

  it("leaves Escape to a popover inside it", async () => {
    const { store, user } = renderPanel();
    const popover = document.createElement("div");
    const field = document.createElement("input");
    popover.setAttribute("popover", "manual");
    popover.append(field);
    screen.getByRole("region", { name: "Task details" }).append(popover);
    popover.showPopover();
    field.focus();
    await user.keyboard("{Escape}");
    expect(store.getState().view.detailsId).toBe(task.id);
  });
});
