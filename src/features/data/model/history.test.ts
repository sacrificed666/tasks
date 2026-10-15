import { describe, expect, it } from "vitest";

import { setupStore } from "@/app/store";
import { listChanged } from "@/features/lists/model/viewSlice";
import { projectAdded, projectMoved, projectRemoved, projectUpdated } from "@/features/projects/model/projectsSlice";
import { selectProjects } from "@/features/projects/model/selectors";
import { selectTasks } from "@/features/tasks/model/selectors";
import {
  allTasksMarked,
  subtaskAdded,
  subtaskMoved,
  subtaskRemoved,
  subtaskRenamed,
  subtaskToggled,
  taskAdded,
  taskDuplicated,
  taskImportanceToggled,
  taskMoved,
  taskNoted,
  taskProjectChanged,
  taskRenamed,
  taskRepeatChanged,
  taskScheduled,
  tasksRemoved,
  tasksRestored,
  tasksScheduled,
  taskToggled,
} from "@/features/tasks/model/tasksSlice";
import { makeProject, makeState, makeTask, sampleTasks } from "@/test/factories";

import { dataImported, dataReplaced } from "./actions";
import { describeChange, HISTORY_LIMIT, redone, undone } from "./history";

// The task titles in the store
const titles = (store: ReturnType<typeof setupStore>) => selectTasks(store.getState()).map((task) => task.title);

const work = makeProject({ id: "work", name: "Work" });

describe("withHistory", () => {
  it("records only actions that change the data", () => {
    const store = setupStore(makeState(sampleTasks));

    store.dispatch(listChanged("today"));
    store.dispatch(taskRenamed("milk", "Buy milk"));
    expect(store.getState().history.past).toHaveLength(0);

    store.dispatch(taskRenamed("milk", "Buy oat milk"));
    expect(store.getState().history.past).toEqual([
      {
        tasks: expect.objectContaining({ ids: ["milk", "report", "call"] }),
        projects: expect.objectContaining({ ids: [] }),
        description: expect.any(Object),
      },
    ]);
  });

  it("undoes and redoes, and a new change clears the redo stack", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(taskRenamed("milk", "Buy oat milk"));
    store.dispatch(taskRenamed("call", "Call grandpa"));

    store.dispatch(undone());
    store.dispatch(undone());
    expect(titles(store)).toEqual(["Buy milk", "Write the quarterly report", "Call grandma"]);
    store.dispatch(undone());
    expect(store.getState().history.future).toHaveLength(2);

    store.dispatch(redone());
    expect(titles(store)).toEqual(["Buy oat milk", "Write the quarterly report", "Call grandma"]);

    store.dispatch(taskImportanceToggled("call"));
    expect(store.getState().history.future).toEqual([]);
    store.dispatch(redone());
    expect(titles(store)[2]).toBe("Call grandma");
  });

  it("restores a deleted project together with its tasks in one step", () => {
    const store = setupStore(
      makeState([makeTask({ id: "a", title: "Report", projectId: "work" }), ...sampleTasks], "all", "", [work]),
    );

    store.dispatch(projectRemoved("work"));
    expect(selectProjects(store.getState())).toEqual([]);
    expect(titles(store)).not.toContain("Report");

    store.dispatch(undone());
    expect(selectProjects(store.getState())).toEqual([work]);
    expect(titles(store)[0]).toBe("Report");
  });

  it("keeps a limited number of steps", () => {
    const store = setupStore(makeState(sampleTasks));
    for (let index = 0; index < HISTORY_LIMIT + 5; index += 1) store.dispatch(taskRenamed("milk", `Milk ${index}`));
    expect(store.getState().history.past).toHaveLength(HISTORY_LIMIT);
  });

  it("forgets the history when another tab replaces the data", () => {
    const store = setupStore(makeState(sampleTasks));
    store.dispatch(taskRenamed("milk", "Buy oat milk"));
    store.dispatch(dataReplaced({ tasks: [makeTask({ id: "remote", title: "Remote" })], projects: [work] }));

    expect(store.getState().history).toEqual({ past: [], future: [] });
    store.dispatch(undone());
    expect(titles(store)).toEqual(["Remote"]);
    expect(selectProjects(store.getState())).toEqual([work]);
  });
});

describe("describeChange", () => {
  const { tasks, projects } = setupStore(makeState(sampleTasks, "all", "", [work])).getState();
  const before = { tasks, projects };
  const report = sampleTasks[1];

  it("names the task for single-task actions", () => {
    expect(describeChange(taskAdded({ title: "New" }), before)).toMatchObject({
      key: "history.added",
      params: { title: "New" },
    });
    expect(describeChange(taskDuplicated("milk"), before).key).toBe("history.duplicated");
    expect(describeChange(taskToggled("milk"), before).key).toBe("history.completed");
    expect(describeChange(taskToggled("report"), before)).toEqual({
      key: "history.reopened",
      params: { title: report?.title },
    });
    expect(describeChange(taskRenamed("milk", "x"), before).key).toBe("history.renamed");
    expect(describeChange(taskImportanceToggled("milk"), before).key).toBe("history.starred");
    expect(describeChange(taskScheduled("milk", null), before).key).toBe("history.scheduled");
    expect(describeChange(taskNoted("milk", "x"), before).key).toBe("history.noted");
    expect(describeChange(taskRepeatChanged("milk", "daily"), before).key).toBe("history.repeat");
    expect(describeChange(taskProjectChanged("milk", "work"), before)).toEqual({
      key: "history.projectChanged",
      params: { title: "Buy milk" },
    });
  });

  it("names the subtask for subtask actions", () => {
    const store = setupStore(
      makeState([makeTask({ id: "trip", title: "Trip", subtasks: [{ id: "s", title: "Passport", completed: true }] })]),
    );
    const state = { tasks: store.getState().tasks, projects: store.getState().projects };
    expect(describeChange(subtaskAdded("trip", "Tickets"), state)).toEqual({
      key: "history.subtaskAdded",
      params: { title: "Tickets" },
    });
    expect(describeChange(subtaskToggled("trip", "s"), state)).toEqual({
      key: "history.subtaskReopened",
      params: { title: "Passport" },
    });
    expect(describeChange(subtaskRenamed("trip", "s", "x"), state).key).toBe("history.subtaskRenamed");
    expect(describeChange(subtaskRemoved("trip", "s"), state).key).toBe("history.subtaskRemoved");
    expect(describeChange(subtaskMoved("trip", "s", 0), state).key).toBe("history.subtasksReordered");
  });

  it("describes bulk actions", () => {
    expect(describeChange(taskMoved({ activeId: "milk", overId: "call" }), before).key).toBe("history.moved");
    expect(describeChange(allTasksMarked(true), before).key).toBe("history.markedAll");
    expect(describeChange(tasksRemoved(["milk", "call"]), before)).toEqual({
      key: "history.removed",
      params: { count: 2 },
    });
    expect(describeChange(tasksRestored([]), before).key).toBe("history.restored");
    expect(describeChange(tasksScheduled(["milk", "call"], "2026-10-01"), before)).toEqual({
      key: "history.rescheduled",
      params: { count: 2 },
    });
    expect(describeChange(dataImported({ tasks: [], projects: [] }), before).key).toBe("history.imported");
    expect(describeChange(listChanged("today"), before).key).toBe("history.changed");
  });

  it("names the project for project actions", () => {
    expect(describeChange(projectAdded({ name: "Home" }), before)).toEqual({
      key: "history.projectAdded",
      params: { name: "Home" },
    });
    expect(describeChange(projectUpdated("work", { name: "Job", color: "red" }), before)).toEqual({
      key: "history.projectEdited",
      params: { name: "Work" },
    });
    expect(describeChange(projectMoved({ activeId: "work", overId: "work" }), before).key).toBe(
      "history.projectsReordered",
    );
    expect(describeChange(projectRemoved("work"), before)).toEqual({
      key: "history.projectRemoved",
      params: { name: "Work" },
    });
  });
});
