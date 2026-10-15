import { describe, expect, it } from "vitest";

import {
  createProject,
  joinProjectName,
  MAX_PROJECT_NAME_LENGTH,
  normalizeProjectName,
  parseProjects,
  PROJECT_COLORS,
  PROJECT_EMOJI,
  splitProjectName,
  suggestProjectColor,
} from "./project";

describe("project names", () => {
  it("collapses whitespace and limits the length", () => {
    expect(normalizeProjectName("  Trip \n to   Lviv ")).toBe("Trip to Lviv");
    expect(Array.from(normalizeProjectName("x".repeat(MAX_PROJECT_NAME_LENGTH + 5)))).toHaveLength(
      MAX_PROJECT_NAME_LENGTH,
    );
  });

  it("uses a leading emoji as the icon", () => {
    expect(splitProjectName("🏠 Home")).toEqual({ emoji: "🏠", label: "Home" });
    expect(splitProjectName("👩‍💻 Code")).toEqual({ emoji: "👩‍💻", label: "Code" });
    expect(splitProjectName("🇺🇦 Trip")).toEqual({ emoji: "🇺🇦", label: "Trip" });
    expect(splitProjectName("Work")).toEqual({ emoji: null, label: "Work" });
    expect(splitProjectName("1st week")).toEqual({ emoji: null, label: "1st week" });
    expect(splitProjectName("🔥")).toEqual({ emoji: null, label: "🔥" });
  });

  it("puts a chosen emoji in front of the name", () => {
    expect(joinProjectName("🏠", " Home ")).toBe("🏠 Home");
    expect(joinProjectName(null, "Home")).toBe("Home");
  });

  it("offers only emoji that work as an icon", () => {
    expect(new Set(PROJECT_EMOJI).size).toBe(PROJECT_EMOJI.length);
    for (const emoji of PROJECT_EMOJI) expect(splitProjectName(joinProjectName(emoji, "Home")).emoji).toBe(emoji);
  });
});

describe("createProject", () => {
  it("normalizes the name and stamps the time", () => {
    expect(createProject({ name: " Work ", color: "teal" }, 7, "p1")).toEqual({
      id: "p1",
      name: "Work",
      color: "teal",
      createdAt: 7,
      updatedAt: 7,
    });
  });

  it("suggests colours in a cycle", () => {
    expect(suggestProjectColor(0)).toBe(PROJECT_COLORS[0]);
    expect(suggestProjectColor(PROJECT_COLORS.length + 1)).toBe(PROJECT_COLORS[1]);
  });
});

describe("parseProjects", () => {
  it("keeps valid projects and repairs colours and timestamps", () => {
    expect(
      parseProjects(
        {
          projects: [
            { id: "a", name: "Work", color: "violet", createdAt: 5, updatedAt: 9 },
            { id: "b", name: "Home", color: "neon", createdAt: "2026-10-01T00:00:00.000Z" },
          ],
        },
        100,
      ),
    ).toEqual([
      { id: "a", name: "Work", color: "violet", createdAt: 5, updatedAt: 9 },
      {
        id: "b",
        name: "Home",
        color: "blue",
        createdAt: Date.parse("2026-10-01T00:00:00.000Z"),
        updatedAt: Date.parse("2026-10-01T00:00:00.000Z"),
      },
    ]);
  });

  it("drops entries without a valid id or name and duplicates", () => {
    expect(
      parseProjects({
        projects: [
          { id: "a", name: "A" },
          { id: "a", name: "Again" },
          { id: "bad id", name: "B" },
          { id: "c", name: "  " },
          42,
        ],
      }).map((project) => project.name),
    ).toEqual(["A"]);
    expect(parseProjects([{ id: "a", name: "A" }])).toEqual([]);
  });
});
