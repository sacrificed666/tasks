import { describe, expect, it } from "vitest";

import { setupStore } from "@/app/store";
import { detailsOpened } from "@/features/lists/model/viewSlice";
import { selectToast } from "@/features/notifications/model/selectors";
import { makeProject, makeState, makeTask } from "@/test/factories";

import { selectProjects } from "./selectors";
import { createProject, deleteProject } from "./thunks";

describe("createProject", () => {
  it("adds the project and opens it", () => {
    const store = setupStore();
    const id = store.dispatch(createProject({ name: "  Garden ", color: "green" }));

    expect(selectProjects(store.getState())).toEqual([expect.objectContaining({ id, name: "Garden", color: "green" })]);
    expect(store.getState().view.list).toBe(`project:${id}`);
  });

  it("ignores blank names", () => {
    const store = setupStore();
    expect(store.dispatch(createProject({ name: "   " }))).toBeNull();
    expect(selectProjects(store.getState())).toEqual([]);
  });
});

describe("deleteProject", () => {
  it("removes the project and its tasks, closes their details and offers undo", () => {
    const store = setupStore(
      makeState(
        [makeTask({ id: "a", title: "Slides", projectId: "work" }), makeTask({ id: "b", title: "Milk" })],
        "project:work",
        "",
        [makeProject({ id: "work", name: "Work" })],
      ),
    );
    store.dispatch(detailsOpened("a"));

    store.dispatch(deleteProject("work"));

    const state = store.getState();
    expect(state.tasks.ids).toEqual(["b"]);
    expect(state.view).toMatchObject({ list: "all", detailsId: null });
    expect(selectToast(state)).toMatchObject({
      message: { key: "toast.projectDeleted", params: { name: "Work", count: 1 } },
      action: { type: "undo" },
    });
  });

  it("names empty projects without a task count", () => {
    const store = setupStore(makeState([], "all", "", [makeProject({ id: "empty", name: "Empty" })]));
    store.dispatch(deleteProject("empty"));
    expect(selectToast(store.getState())?.message).toEqual({
      key: "toast.projectDeletedEmpty",
      params: { name: "Empty" },
    });
    store.dispatch(deleteProject("missing"));
    expect(selectProjects(store.getState())).toEqual([]);
  });
});
