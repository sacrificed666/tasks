import { afterEach, describe, expect, it, vi } from "vitest";

import { mockMediaQueries } from "@/test/render";

import { celebrate } from "./celebrate";

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, "animate");
});

describe("celebrate", () => {
  it("does nothing when motion is reduced", () => {
    celebrate();
    expect(document.body.childElementCount).toBe(0);
  });

  it("throws confetti from a point and cleans up when it lands", async () => {
    mockMediaQueries([], { motion: true });
    const animate = vi.fn<() => { finished: Promise<void> }>(() => ({ finished: Promise.resolve() }));
    Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
    celebrate({ x: 10, y: 20 });
    const layer = document.body.lastElementChild;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer?.childElementCount).toBe(36);
    expect(animate).toHaveBeenCalledTimes(36);
    await vi.waitFor(() => {
      expect(layer).not.toBeInTheDocument();
    });
  });
});
