import { describe, expect, it } from "vitest";

import { dataImported, dataReplaced } from "@/features/data/model/actions";
import { makeProject } from "@/test/factories";

import {
  projectAdded,
  projectMoved,
  projectRemoved,
  projectsAdapter,
  projectsSlice,
  projectUpdated,
} from "./projectsSlice";

const reduce = projectsSlice.reducer;
const work = makeProject({ id: "work", name: "Work" });
const home = makeProject({ id: "home", name: "Home", color: "green" });
const garden = makeProject({ id: "garden", name: "Garden", color: "teal" });
const initial = projectsAdapter.setAll(projectsAdapter.getInitialState(), [work, home, garden]);

describe("projectsSlice", () => {
  it("adds named projects once", () => {
    const state = reduce(projectsAdapter.getInitialState(), projectAdded({ name: "  Errands ", color: "red" }));
    expect(Object.values(state.entities).map((project) => project?.name)).toEqual(["Errands"]);
    expect(reduce(state, projectAdded({ name: "   ", color: "red" })).ids).toHaveLength(1);
    expect(reduce(initial, { type: projectAdded.type, payload: work }).ids).toEqual(initial.ids);
  });

  it("renames and recolours a project, ignoring empty or unchanged edits", () => {
    const renamed = reduce(initial, projectUpdated("work", { name: "Office", color: "indigo" }));
    expect(renamed.entities.work).toMatchObject({ name: "Office", color: "indigo" });
    expect(renamed.entities.work?.updatedAt).toBeGreaterThan(work.updatedAt);
    expect(reduce(initial, projectUpdated("work", { name: " ", color: "indigo" }))).toBe(initial);
    expect(reduce(initial, projectUpdated("work", { name: "Work", color: "blue" }))).toBe(initial);
    expect(reduce(initial, projectUpdated("missing", { name: "Office", color: "blue" }))).toBe(initial);
  });

  it("moves a project to the place of another", () => {
    expect(reduce(initial, projectMoved({ activeId: "garden", overId: "work" })).ids).toEqual([
      "garden",
      "work",
      "home",
    ]);
    expect(reduce(initial, projectMoved({ activeId: "work", overId: "work" }))).toBe(initial);
    expect(reduce(initial, projectMoved({ activeId: "missing", overId: "work" }))).toBe(initial);
  });

  it("removes a project", () => {
    expect(reduce(initial, projectRemoved("home")).ids).toEqual(["work", "garden"]);
  });

  it("replaces every project or imports only the new ones", () => {
    const office = makeProject({ id: "work", name: "Office" });
    expect(reduce(initial, dataReplaced({ tasks: [], projects: [office] })).ids).toEqual(["work"]);
    const imported = reduce(
      initial,
      dataImported({ tasks: [], projects: [office, makeProject({ id: "gym", name: "Gym" })] }),
    );
    expect(imported.ids).toEqual(["work", "home", "garden", "gym"]);
    expect(imported.entities.work?.name).toBe("Work");
  });
});
