import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { clippedText, MAC_USER_AGENT, openPalette, preferences, runCommand, seed } from "./helpers";

test.use({ reducedMotion: "reduce" });

// Axe violations of the page, as rule ids and targets
const violations = async (page: Page) => {
  await expect(page.getByRole("main")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .options({ rules: { "label-content-name-mismatch": { enabled: true }, "target-size": { enabled: true } } })
    .analyze();
  return results.violations.map((violation) => ({
    rule: violation.id,
    targets: violation.nodes.map((node) => node.target.join(" ")),
  }));
};

// Background, outline and border of an element, to compare states
const emphasis = (locator: Locator): Promise<string> =>
  locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.backgroundColor, style.outlineStyle, style.outlineColor, style.borderColor].join(" ");
  });

test.beforeEach(async ({ page }) => {
  await seed(page);
});

for (const scheme of ["light", "dark"] as const) {
  test(`has no detectable accessibility issues in the ${scheme} scheme`, async ({ page }) => {
    await preferences(page, { appearance: scheme });
    await page.goto("./");
    expect(await violations(page)).toEqual([]);
    await page.goto("./?list=today");
    await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
}

test("keeps the empty state accessible", async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => localStorage.removeItem("tasks/data"));
  await page.goto("./?list=upcoming");
  expect(await violations(page)).toEqual([]);
});

test("keeps dialogs accessible", async ({ page }) => {
  await page.goto("./");
  await runCommand(page, "Open settings");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  expect(await violations(page)).toEqual([]);
  await page.keyboard.press("Escape");

  const palette = await openPalette(page);
  await palette.getByRole("combobox").fill("invoice");
  expect(await violations(page)).toEqual([]);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue("Send the invoice");
  expect(await violations(page)).toEqual([]);
});

test("keeps the Ukrainian interface accessible", async ({ page }) => {
  await preferences(page, { locale: "uk" });
  await page.goto("./");
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  expect(await violations(page)).toEqual([]);
});

test.describe("with the full effects of Apple devices", () => {
  test.use({ userAgent: MAC_USER_AGENT });

  for (const scheme of ["light", "dark"] as const) {
    test(`keeps the glass readable in the ${scheme} scheme`, async ({ page }) => {
      await preferences(page, { appearance: scheme });
      await page.goto("./");
      await expect(page.locator("html")).toHaveAttribute("data-effects", "full");
      expect(await violations(page)).toEqual([]);
    });
  }
});

test("can be used with the keyboard alone", async ({ page, browserName }) => {
  await page.goto("./");
  // Safari moves focus to links with Option+Tab
  await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
  await expect(page.getByRole("link", { name: "Skip to tasks" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

for (const path of ["./", "./?list=today", "./?list=upcoming"]) {
  test(`reflows at 320 pixels without scrolling sideways on ${path}`, async ({ page }) => {
    await preferences(page, { locale: "nl" });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

for (const [locale, settings] of [
  ["uk", "Налаштування"],
  ["pl", "Ustawienia"],
  ["pt", "Definições"],
] as const) {
  test(`shows every word whole at 360 pixels in ${locale}`, async ({ page }) => {
    await preferences(page, { locale });
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto("./");
    await expect(page.getByRole("main")).toBeVisible();
    expect(await clippedText(page)).toEqual([]);
    await page.getByRole("button", { name: settings, exact: true }).first().click();
    await expect(page.getByRole("dialog", { name: settings })).toBeVisible();
    expect(await clippedText(page)).toEqual([]);
  });
}

test.describe("in forced colours mode", () => {
  test.use({ forcedColors: "active" });

  test("keeps the chosen option visible", async ({ page }) => {
    await page.goto("./");
    await runCommand(page, "Open settings");
    const settings = page.getByRole("dialog", { name: "Settings" });
    const group = settings.getByRole("group", { name: "Appearance" });
    const chosen = group.locator("label:has(:checked)").first();
    const other = group.locator("label:not(:has(:checked))").first();
    expect(await emphasis(chosen)).not.toBe(await emphasis(other));
  });
});
