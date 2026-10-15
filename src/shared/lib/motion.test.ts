import { describe, expect, it, vi } from "vitest";

import { prefersReducedMotion, waitForTransitions } from "./motion";

// An element with these running animations
const elementWith = (animations: Array<{ finished: Promise<unknown> }>) => {
  const element = document.createElement("div");
  Object.defineProperty(element, "getAnimations", { value: () => animations });
  return element;
};

describe("motion helpers", () => {
  it("reads the reduced motion preference", () => {
    expect(prefersReducedMotion()).toBe(true);
  });

  it("resolves immediately without an element or running animations", async () => {
    await expect(waitForTransitions(null)).resolves.toBeUndefined();
    await expect(waitForTransitions(elementWith([]))).resolves.toBeUndefined();
  });

  it("waits until every animation settles", async () => {
    const deferred: { resolve?: () => void } = {};
    const finished = new Promise<void>((resolve) => {
      deferred.resolve = resolve;
    });
    const settled = vi.fn<() => void>();
    const waiting = waitForTransitions(
      elementWith([{ finished }, { finished: Promise.reject(new Error("cancelled")) }]),
    ).then(settled);

    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();

    deferred.resolve?.();
    await waiting;
    expect(settled).toHaveBeenCalledOnce();
  });

  it("gives up after a safety timeout", async () => {
    vi.useFakeTimers();
    const waiting = waitForTransitions(elementWith([{ finished: new Promise(() => {}) }]));
    await vi.advanceTimersByTimeAsync(1200);
    await expect(waiting).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
