import { describe, expect, it, vi } from "vitest";

import { setupStore } from "@/app/store";
import * as catalog from "@/shared/i18n/catalog";

import { changeLocale } from "./thunks";

describe("changeLocale", () => {
  it("loads the messages before switching", async () => {
    const store = setupStore();
    expect(await store.dispatch(changeLocale("it"))).toBe(true);
    expect(store.getState().settings.locale).toBe("it");
  });

  it("keeps the current language and reports a failure", async () => {
    vi.spyOn(catalog, "loadMessages").mockRejectedValue(new Error("offline"));
    const store = setupStore();

    expect(await store.dispatch(changeLocale("pl"))).toBe(false);
    expect(store.getState().settings.locale).toBe("en");
    expect(store.getState().toast.current).toMatchObject({ message: { key: "toast.languageFailed" }, tone: "error" });
  });
});
