import { describe, expect, it } from "vitest";

import { isEditableTarget, isModKey, isPlainKey, isRedoKey, isUndoKey } from "./keyboard";

// A keydown event
const keyboardEvent = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);

describe("isEditableTarget", () => {
  it("detects text fields", () => {
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(textarea)).toBe(true);
  });

  it("ignores controls that do not accept text", () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    expect(isEditableTarget(checkbox)).toBe(false);
    expect(isEditableTarget(document.createElement("button"))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });
});

describe("key matchers", () => {
  it("matches plain keys regardless of case", () => {
    const matches = isPlainKey("n");
    expect(matches(keyboardEvent({ key: "n" }))).toBe(true);
    expect(matches(keyboardEvent({ key: "N", shiftKey: true }))).toBe(true);
    expect(matches(keyboardEvent({ key: "n", ctrlKey: true }))).toBe(false);
  });

  it("matches the undo shortcut on every platform", () => {
    expect(isUndoKey(keyboardEvent({ key: "z", metaKey: true }))).toBe(true);
    expect(isUndoKey(keyboardEvent({ key: "Z", ctrlKey: true }))).toBe(true);
    expect(isUndoKey(keyboardEvent({ key: "z", ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(isUndoKey(keyboardEvent({ key: "z" }))).toBe(false);
  });

  it("matches the redo shortcut with Shift or Ctrl+Y", () => {
    expect(isRedoKey(keyboardEvent({ key: "z", metaKey: true, shiftKey: true }))).toBe(true);
    expect(isRedoKey(keyboardEvent({ key: "Z", ctrlKey: true, shiftKey: true }))).toBe(true);
    expect(isRedoKey(keyboardEvent({ key: "y", ctrlKey: true }))).toBe(true);
    expect(isRedoKey(keyboardEvent({ key: "y", metaKey: true }))).toBe(false);
    expect(isRedoKey(keyboardEvent({ key: "z", metaKey: true }))).toBe(false);
  });

  it("matches modifier shortcuts without Alt", () => {
    const matches = isModKey("k");
    expect(matches(keyboardEvent({ key: "k", metaKey: true }))).toBe(true);
    expect(matches(keyboardEvent({ key: "K", ctrlKey: true }))).toBe(true);
    expect(matches(keyboardEvent({ key: "k", ctrlKey: true, altKey: true }))).toBe(false);
    expect(matches(keyboardEvent({ key: "k" }))).toBe(false);
  });
});
