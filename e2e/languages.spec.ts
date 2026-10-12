import { expect, test } from "@playwright/test";

import { option, runCommand } from "./helpers";

test.describe("with a Ukrainian browser", () => {
  test.use({ locale: "uk-UA" });

  test("starts in Ukrainian", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("lang", "uk");
    await expect(page.getByRole("heading", { level: 1, name: "Усі завдання" })).toBeVisible();
    await expect(page).toHaveTitle("Завдання · Приватний планувальник завдань");
  });
});

test.describe("with a Czech browser", () => {
  test.use({ locale: "cs-CZ" });

  test("starts in Czech and understands Czech quick add phrases", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("html")).toHaveAttribute("lang", "cs");
    await expect(page.getByRole("heading", { level: 1, name: "Všechny úkoly" })).toBeVisible();
    await expect(page).toHaveTitle("Úkoly · Soukromý plánovač úkolů");
    await page.getByRole("textbox", { name: "Nový úkol" }).fill("Zavolat mámě zítra");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Zavolat mámě", { exact: true })).toBeVisible();
    await expect(page.getByText("Zítra", { exact: true }).first()).toBeVisible();
  });
});

test("switches the language in the settings and remembers it", async ({ page }) => {
  await page.goto("./");
  await runCommand(page, "Open settings");
  await option(page, "Polski").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await page.getByRole("dialog", { name: "Ustawienia" }).getByRole("button", { name: "Zamknij" }).click();
  await expect(page.getByRole("dialog", { name: "Ustawienia" })).toBeHidden();
  await page.waitForFunction(() => {
    const state: unknown = history.state;
    return typeof state !== "object" || state === null || !("taskOverlay" in state);
  });

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
  await expect(page.getByRole("textbox", { name: "Nowe zadanie" })).toBeVisible();
});
