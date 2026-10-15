import { expect, test } from "@playwright/test";

import { openPalette, runCommand, seed } from "./helpers";

test("runs without console errors or policy violations", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  await page.addInitScript(() => {
    const violations: string[] = [];
    Reflect.set(window, "policyViolations", violations);
    document.addEventListener("securitypolicyviolation", (event) => {
      violations.push(`${event.violatedDirective} ${event.blockedURI}`);
    });
  });
  await seed(page);

  await page.goto("./");
  await page.getByRole("textbox", { name: "New task" }).fill("Plan the weekend tomorrow");
  await page.getByRole("textbox", { name: "New task" }).press("Enter");
  await runCommand(page, "Open settings");
  await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible();
  await page.keyboard.press("Escape");
  await openPalette(page);
  await page.keyboard.press("Escape");

  expect(problems).toEqual([]);
  expect(await page.evaluate(() => Reflect.get(window, "policyViolations"))).toEqual([]);
});

test("enforces the Content Security Policy and Trusted Types", async ({ page }) => {
  await page.goto("./");
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(policy).toContain("script-src 'self'");
  expect(policy).toContain("require-trusted-types-for 'script'");
  const blocked = await page.evaluate(() => {
    try {
      document.createElement("div").innerHTML = "<img src=x onerror=alert(1)>";
      return false;
    } catch (error) {
      return error instanceof TypeError;
    }
  });
  expect(blocked).toBe(true);
});
