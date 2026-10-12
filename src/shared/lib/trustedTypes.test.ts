import { describe, expect, it, vi } from "vitest";

import { installScriptUrlPolicy } from "./trustedTypes";

type CreateScriptUrl = (input: string) => string;

describe("installScriptUrlPolicy", () => {
  it("does nothing without Trusted Types support", () => {
    expect(installScriptUrlPolicy(["/sw.js"])).toBe(false);
  });

  it("allows only same-origin scripts from the allow list", () => {
    const policy: { createScriptURL?: CreateScriptUrl } = {};
    vi.stubGlobal("trustedTypes", {
      createPolicy: (_name: string, options: { createScriptURL: CreateScriptUrl }) => {
        policy.createScriptURL = options.createScriptURL;
      },
    });

    expect(installScriptUrlPolicy(["/sw.js"])).toBe(true);
    expect(policy.createScriptURL?.("/sw.js")).toBe(`${location.origin}/sw.js`);
    expect(() => policy.createScriptURL?.("/evil.js")).toThrow(TypeError);
    expect(() => policy.createScriptURL?.("https://example.com/sw.js")).toThrow(TypeError);
  });
});
