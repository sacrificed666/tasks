import { afterEach, describe, expect, it, vi } from "vitest";

import { requestPersistence } from "./storage";

// Puts a storage manager on the navigator for one test
const stubStorage = (persisted: boolean, persist: () => Promise<boolean>) => {
  const manager = {
    persisted: vi.fn<() => Promise<boolean>>(async () => persisted),
    persist: vi.fn<() => Promise<boolean>>(persist),
  };
  Object.defineProperty(navigator, "storage", { configurable: true, value: manager });
  return manager;
};

afterEach(() => {
  Reflect.deleteProperty(navigator, "storage");
});

describe("requestPersistence", () => {
  it("asks only when the data is not persistent yet", async () => {
    const manager = stubStorage(false, async () => true);
    await expect(requestPersistence()).resolves.toBe(true);
    expect(manager.persist).toHaveBeenCalledOnce();

    const granted = stubStorage(true, async () => true);
    await expect(requestPersistence()).resolves.toBe(true);
    expect(granted.persist).not.toHaveBeenCalled();
  });

  it("reports false when the browser refuses, fails or has no storage manager", async () => {
    stubStorage(false, async () => false);
    await expect(requestPersistence()).resolves.toBe(false);

    stubStorage(false, async () => {
      throw new Error("Blocked");
    });
    await expect(requestPersistence()).resolves.toBe(false);

    Reflect.deleteProperty(navigator, "storage");
    await expect(requestPersistence()).resolves.toBe(false);
  });
});
