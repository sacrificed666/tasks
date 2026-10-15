import { expect, test } from "@playwright/test";

import { seed } from "./helpers";

// A Monday morning in June, so dates and due chips never change
const NOW = new Date("2026-06-15T09:00:00+03:00");

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await seed(page);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`the tasks of today in the ${colorScheme} appearance`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    await expect(page.getByRole("checkbox", { name: "Daily standup" })).toBeVisible();
    await expect(page).toHaveScreenshot(`today-${colorScheme}.png`);
  });
}

test("the tasks of today on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("checkbox", { name: "Daily standup" })).toBeVisible();
  await expect(page).toHaveScreenshot("today-phone.png");
});
