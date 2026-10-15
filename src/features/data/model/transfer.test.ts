import { describe, expect, it } from "vitest";

import { makeProject, makeTask, sampleTasks } from "@/test/factories";

import { createExport, exportFileName, MAX_IMPORT_BYTES, MAX_IMPORT_TASKS, readImport } from "./transfer";

const projects = [makeProject({ id: "work", name: "Work", color: "violet" })];
const tasks = [makeTask({ id: "deck", title: "Slides", projectId: "work" }), ...sampleTasks];

describe("createExport", () => {
  it("wraps tasks and projects with metadata", () => {
    expect(createExport({ tasks, projects }, new Date("2026-09-30T10:00:00.000Z"))).toEqual({
      app: "tasks",
      exportedAt: "2026-09-30T10:00:00.000Z",
      tasks,
      projects,
    });
  });

  it("names files after the local date", () => {
    expect(exportFileName(new Date(2026, 9, 1, 23, 30))).toBe("tasks-2026-10-01.json");
  });
});

describe("readImport", () => {
  it("reads exports produced by the app", () => {
    const text = JSON.stringify(createExport({ tasks, projects }, new Date()));
    expect(readImport(text)).toEqual({ tasks, projects });
  });

  it("reads files without projects and refuses a plain list", () => {
    expect(readImport(JSON.stringify({ version: 5, tasks: sampleTasks }))).toEqual({
      tasks: sampleTasks,
      projects: [],
    });
    expect(readImport(JSON.stringify(sampleTasks))).toBeNull();
  });

  it("rejects broken, foreign and oversized files", () => {
    expect(readImport("{broken")).toBeNull();
    expect(readImport(JSON.stringify({ items: [] }))).toBeNull();
    expect(readImport(" ".repeat(MAX_IMPORT_BYTES + 1))).toBeNull();
  });

  it("limits the number of imported tasks", () => {
    const many = Array.from({ length: MAX_IMPORT_TASKS + 5 }, (_, index) =>
      makeTask({ id: `task-${index}`, title: `Task ${index}` }),
    );
    expect(readImport(JSON.stringify({ tasks: many }))?.tasks).toHaveLength(MAX_IMPORT_TASKS);
  });
});
