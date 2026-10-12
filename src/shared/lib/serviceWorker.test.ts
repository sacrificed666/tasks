import { describe, expect, it, vi } from "vitest";

import * as navigation from "./navigation";
import { applyUpdate, registerUpdateHandler } from "./serviceWorker";

describe("applyUpdate", () => {
  it("reloads the page when no update is waiting", () => {
    const reload = vi.spyOn(navigation, "reloadPage").mockImplementation(() => {});
    applyUpdate();
    expect(reload).toHaveBeenCalledOnce();
  });

  it("applies the waiting update instead", () => {
    const reload = vi.spyOn(navigation, "reloadPage").mockImplementation(() => {});
    const handler = vi.fn<() => void>();
    registerUpdateHandler(handler);
    applyUpdate();
    expect(handler).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
  });
});
