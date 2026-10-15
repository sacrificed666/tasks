import type { Active, ClientRect, DroppableContainer, Over } from "@dnd-kit/core";
import { describe, expect, it } from "vitest";

import { createTranslator } from "@/shared/i18n/translate";

import { collisions, createAnnouncements, isDropTarget, resolveDrop } from "./dnd";

// A client rectangle
const rect = (left: number, top: number, width = 100, height = 40): ClientRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

// The sortable data of a row in a list
const sortable = (containerId: string, index: number) => ({ sortable: { containerId, items: ["a", "b"], index } });

// The task being dragged
const active = (id: string, data: Record<string, unknown>): Active => ({
  id,
  data: { current: data },
  rect: { current: { initial: rect(0, 0), translated: rect(0, 0) } },
});

// The target under the pointer
const over = (id: string, data: Record<string, unknown>): Over => ({
  id,
  rect: rect(0, 0),
  disabled: false,
  data: { current: data },
});

// A droppable container with its data
const container = (id: string, data: Record<string, unknown> = {}): DroppableContainer => ({
  id,
  key: id,
  data: { current: data },
  disabled: false,
  node: { current: null },
  rect: { current: null },
});

describe("resolveDrop", () => {
  const slides = active("a", { title: "Slides", ...sortable("today", 0) });

  it("drops on a list or project in the sidebar", () => {
    expect(resolveDrop(slides, over("drop:today", { target: "today" }))).toEqual({
      type: "target",
      id: "a",
      target: "today",
    });
    expect(resolveDrop(slides, over("drop:project:work", { target: "project:work" }))).toEqual({
      type: "target",
      id: "a",
      target: "project:work",
    });
    expect(resolveDrop(slides, over("drop:nowhere", { target: "nowhere" }))).toBeNull();
  });

  it("reorders only within the same section", () => {
    expect(resolveDrop(slides, over("b", { title: "Report", ...sortable("today", 1) }))).toEqual({
      type: "reorder",
      activeId: "a",
      overId: "b",
    });
    expect(resolveDrop(slides, over("b", { title: "Report", ...sortable("overdue", 1) }))).toBeNull();
    expect(resolveDrop(slides, over("a", { title: "Slides", ...sortable("today", 0) }))).toBeNull();
    expect(resolveDrop(slides, null)).toBeNull();
  });
});

describe("collisions", () => {
  const today = container("drop:today", { target: "today" });
  const first = container("a");
  const second = container("b");
  const droppableRects = new Map([
    ["drop:today", rect(0, 0, 200, 40)],
    ["a", rect(300, 0)],
    ["b", rect(300, 100)],
  ]);
  // The drop target for a pointer and a dragged rectangle
  const detect = (pointer: { x: number; y: number } | null, dragged: ClientRect) =>
    collisions({
      active: active("a", {}),
      collisionRect: dragged,
      droppableRects,
      droppableContainers: [today, first, second],
      pointerCoordinates: pointer,
    }).map((collision) => collision.id);

  it("prefers a sidebar target under the pointer", () => {
    expect(detect({ x: 50, y: 20 }, rect(300, 90))).toEqual(["drop:today"]);
  });

  it("falls back to the closest row and never to a target the pointer is not over", () => {
    expect(detect({ x: 350, y: 120 }, rect(300, 90))[0]).toBe("b");
    expect(detect(null, rect(300, 0))).toEqual(["a", "b"]);
  });

  it("recognises drop targets by their id", () => {
    expect(isDropTarget(today)).toBe(true);
    expect(isDropTarget(first)).toBe(false);
    expect(isDropTarget(null)).toBe(false);
  });
});

describe("createAnnouncements", () => {
  const announcements = createAnnouncements(createTranslator("en"));
  const slides = active("a", { title: "Slides" });

  it("names tasks and sidebar targets", () => {
    expect(announcements.onDragStart({ active: slides })).toBe("Picked up “Slides”.");
    expect(announcements.onDragOver({ active: slides, over: over("drop:today", { label: "Today" }) })).toBe(
      "“Slides” is over Today.",
    );
    expect(announcements.onDragEnd({ active: slides, over: over("drop:today", { label: "Today" }) })).toBe(
      "“Slides” moved to Today.",
    );
    expect(announcements.onDragOver({ active: slides, over: over("b", { title: "Report" }) })).toBe(
      "“Slides” moved next to “Report”.",
    );
  });

  it("explains drops outside the list and cancelled drags", () => {
    expect(announcements.onDragOver({ active: slides, over: null })).toBe("“Slides” is outside the list.");
    expect(announcements.onDragEnd({ active: slides, over: null })).toBe("“Slides” dropped.");
    expect(announcements.onDragCancel({ active: slides, over: null })).toBe(
      "Reordering cancelled. “Slides” returned to its place.",
    );
    expect(announcements.onDragStart({ active: active("x", {}) })).toBe("Picked up the task.");
  });
});
