import { describe, expect, it } from "vitest";

import { getEffectsLevel, prefersRichEffects } from "@/shared/lib/effects";

import { applySettings, DEFAULT_SETTINGS, readSettings, resolveEffects } from "./settings";

describe("effects", () => {
  it("resolves the automatic level from the device", () => {
    expect(resolveEffects("auto", true)).toBe("full");
    expect(resolveEffects("auto", false)).toBe("reduced");
    expect(resolveEffects("full", false)).toBe("full");
    expect(resolveEffects("reduced", true)).toBe("reduced");
  });

  it("prefers rich effects only on Apple devices", () => {
    expect(prefersRichEffects("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe(true);
    expect(prefersRichEffects("Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)")).toBe(true);
    expect(prefersRichEffects("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(false);
  });

  it("applies the resolved level to the document and the shared store", () => {
    const root = document.createElement("html");
    applySettings({ ...DEFAULT_SETTINGS, effects: "full" }, root);
    expect(root.dataset.effects).toBe("full");
    expect(getEffectsLevel()).toBe("full");

    applySettings({ ...DEFAULT_SETTINGS, effects: "reduced" }, root);
    expect(root.dataset.effects).toBe("reduced");
    expect(getEffectsLevel()).toBe("reduced");
  });
});

describe("readSettings", () => {
  it("validates every stored value", () => {
    expect(
      readSettings(
        { appearance: "dark", accent: "sunset", backdrop: "plain", glass: "tinted", locale: "it", effects: "full" },
        [],
      ),
    ).toEqual({
      appearance: "dark",
      accent: "sunset",
      backdrop: "plain",
      glass: "tinted",
      locale: "it",
      effects: "full",
    });
    expect(readSettings({ backdrop: "photo", glass: "frosted" }, [])).toMatchObject({
      backdrop: "aurora",
      glass: "clear",
    });
    expect(readSettings({ effects: "turbo", locale: "xx" }, ["nl-BE"])).toMatchObject({
      effects: "auto",
      locale: "nl",
    });
  });
});
