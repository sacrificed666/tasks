import { afterEach, describe, expect, it, vi } from "vitest";

import { applyUpdate } from "@/shared/lib/serviceWorker";

import { startPwa } from "./pwa";
import { setupStore } from "./store";

interface RegisterOptions {
  onNeedRefresh: () => void;
  onOfflineReady: () => void;
}

const { registerSW, updateServiceWorker } = vi.hoisted(() => {
  const update = vi.fn<(reload: boolean) => Promise<void>>(async () => {});
  return { updateServiceWorker: update, registerSW: vi.fn<(options: RegisterOptions) => typeof update>(() => update) };
});

vi.mock("virtual:pwa-register", () => ({ registerSW }));

// A production build in a browser with service workers
const production = () => {
  vi.stubEnv("PROD", true);
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: {} });
};

afterEach(() => {
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("startPwa", () => {
  it("stays off in development", () => {
    startPwa(setupStore());
    expect(registerSW).not.toHaveBeenCalled();
  });

  it("offers a waiting update in a toast and applies it from there", () => {
    production();
    const store = setupStore();
    startPwa(store);
    registerSW.mock.lastCall?.[0].onNeedRefresh();
    expect(store.getState().toast.current).toMatchObject({
      message: { key: "toast.updateReady" },
      action: { type: "reload" },
    });
    applyUpdate();
    expect(updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it("says when the app is ready to work offline", () => {
    production();
    const store = setupStore();
    startPwa(store);
    registerSW.mock.lastCall?.[0].onOfflineReady();
    expect(store.getState().toast.current).toMatchObject({ message: { key: "toast.offlineReady" }, tone: "success" });
  });
});
