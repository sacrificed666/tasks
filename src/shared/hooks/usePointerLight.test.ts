import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { mockMediaQueries } from "@/test/render";

import { setEffectsLevel } from "../lib/effects";
import { usePointerLight } from "./usePointerLight";

// A glass panel that catches the light, with a child under the pointer
const panel = () => {
  const glass = document.createElement("div");
  glass.dataset.glassLight = "";
  const child = document.createElement("span");
  glass.append(child);
  document.body.append(glass);
  return { glass, child };
};

// Moves the pointer over an element and waits for the next frame
const point = async (target: Element, clientX: number, clientY: number) => {
  target.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX, clientY }));
  await new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
};

afterEach(() => {
  setEffectsLevel("reduced");
  document.body.replaceChildren();
});

describe("usePointerLight", () => {
  it("moves the light of the panel under a mouse with full effects", async () => {
    mockMediaQueries(["(hover: hover) and (pointer: fine)"]);
    setEffectsLevel("full");
    const { glass, child } = panel();
    const { unmount } = renderHook(() => usePointerLight());
    await point(child, 30, 12);
    expect(glass.style.getPropertyValue("--light-x")).toBe("30px");
    expect(glass.style.getPropertyValue("--light-y")).toBe("12px");
    unmount();
    await point(child, 50, 50);
    expect(glass.style.getPropertyValue("--light-x")).toBe("30px");
  });

  it("stays off with reduced effects", async () => {
    const { glass, child } = panel();
    renderHook(() => usePointerLight());
    await point(child, 30, 12);
    expect(glass.style.getPropertyValue("--light-x")).toBe("");
  });
});
