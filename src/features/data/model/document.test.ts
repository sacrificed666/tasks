import { describe, expect, it } from "vitest";

import { makeProject, makeTask } from "@/test/factories";

import { linkProjects, parseData, serializeData } from "./document";

const work = makeProject({ id: "work", name: "Work" });

describe("parseData", () => {
  it("reads tasks and projects and keeps their links", () => {
    const task = makeTask({ id: "a", title: "Report", projectId: "work" });
    expect(parseData({ tasks: [task], projects: [work] })).toEqual({ tasks: [task], projects: [work] });
  });

  it("drops links to projects that do not exist", () => {
    const data = parseData({ tasks: [makeTask({ id: "a", title: "Orphan", projectId: "gone" })], projects: [] });
    expect(data?.tasks[0]?.projectId).toBeNull();
  });

  it("rejects input without tasks", () => {
    expect(parseData({ projects: [work] })).toBeNull();
    expect(parseData("nope")).toBeNull();
  });
});

describe("linkProjects", () => {
  it("keeps the same objects when every link is valid", () => {
    const task = makeTask({ id: "a", title: "Report", projectId: "work" });
    expect(linkProjects([task], new Set(["work"]))[0]).toBe(task);
  });
});

describe("serializeData", () => {
  it("writes tasks and projects", () => {
    expect(JSON.parse(serializeData({ tasks: [], projects: [work] }))).toEqual({
      tasks: [],
      projects: [work],
    });
  });
});
