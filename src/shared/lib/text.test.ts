import { describe, expect, it } from "vitest";

import { fuzzyScore, normalizeForSearch } from "./text";

describe("normalizeForSearch", () => {
  it("removes diacritics, letter case and surrounding whitespace", () => {
    expect(normalizeForSearch("  Crème BRÛLÉE ")).toBe("creme brulee");
    expect(normalizeForSearch("ЇЖАК")).toBe(normalizeForSearch("їжак"));
  });
});

describe("fuzzyScore", () => {
  it("matches everything with an empty query", () => {
    expect(fuzzyScore("  ", "Anything")).toBe(0);
  });

  it("returns null when the characters are missing", () => {
    expect(fuzzyScore("xyz", "Go to Today")).toBeNull();
    expect(fuzzyScore("yadot", "Go to Today")).toBeNull();
  });

  it("ranks substrings above scattered matches and word starts above inner matches", () => {
    const substring = fuzzyScore("today", "Go to Today");
    const scattered = fuzzyScore("gtt", "Go to Today");
    const inner = fuzzyScore("oday", "Go to Today");

    expect(substring).toBeGreaterThan(inner ?? 0);
    expect(inner).toBeGreaterThan(scattered ?? 0);
    expect(scattered).not.toBeNull();
  });

  it("rewards consecutive characters and rejects widely scattered ones", () => {
    expect(fuzzyScore("sorbd", "Sort by date")).toBeGreaterThan(fuzzyScore("sbd", "Sort by date") ?? 0);
    expect(fuzzyScore("ort", "Sort by date")).toBeGreaterThan(fuzzyScore("sorbd", "Sort by date") ?? 0);
    expect(fuzzyScore("sye", "Sort by date")).toBeNull();
  });

  it("ignores letter case, diacritics and spaces in the query", () => {
    expect(fuzzyScore("CAFE", "Visit the café")).not.toBeNull();
    expect(fuzzyScore("g t", "Go to Today")).not.toBeNull();
  });
});
