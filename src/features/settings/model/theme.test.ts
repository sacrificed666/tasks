import { describe, expect, it } from "vitest";

import { applyTheme, isAccent, isAppearance, isBackdrop, isGlassStyle, resolveAppearance } from "./theme";

describe("theme", () => {
  it("validates settings", () => {
    expect(isAppearance("light")).toBe(true);
    expect(isAppearance("sepia")).toBe(false);
    expect(isAccent("forest")).toBe(true);
    expect(isAccent("mint")).toBe(true);
    expect(isAccent("magenta")).toBe(false);
    expect(isBackdrop("nebula")).toBe(true);
    expect(isBackdrop("photo")).toBe(false);
    expect(isGlassStyle("tinted")).toBe(true);
    expect(isGlassStyle("frosted")).toBe(false);
  });

  it("resolves the system appearance", () => {
    expect(resolveAppearance("light")).toBe("light");
    expect(resolveAppearance("system")).toBe("dark");
  });

  it("applies settings to the document", () => {
    const light = Object.assign(document.createElement("meta"), { name: "theme-color" });
    const dark = Object.assign(document.createElement("meta"), { name: "theme-color" });
    light.setAttribute("media", "(prefers-color-scheme: light)");
    dark.setAttribute("media", "(prefers-color-scheme: dark)");
    document.head.append(light, dark);

    applyTheme({ appearance: "light", accent: "sunset", backdrop: "ocean", glass: "tinted" });
    expect(document.documentElement.dataset).toMatchObject({
      appearance: "light",
      accent: "sunset",
      backdrop: "ocean",
      glass: "tinted",
    });
    expect([light.content, dark.content]).toEqual(["#e8edf6", "#e8edf6"]);

    applyTheme({ appearance: "system", accent: "sunset", backdrop: "ocean", glass: "tinted" });
    expect([light.content, dark.content]).toEqual(["#e8edf6", "#070a14"]);
    light.remove();
    dark.remove();
  });

  it("colours a theme-color tag without a media query after the resolved appearance", () => {
    const meta = Object.assign(document.createElement("meta"), { name: "theme-color" });
    document.head.append(meta);
    applyTheme({ appearance: "system", accent: "blue", backdrop: "aurora", glass: "clear" });
    expect(meta.content).toBe("#070a14");
    meta.remove();
  });
});
