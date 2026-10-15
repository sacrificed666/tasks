import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("keeps working offline once the app has been opened", async ({ page, context }) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "All tasks" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Offline" }).first()).toBeAttached();
  await page.getByRole("textbox", { name: "New task" }).fill("Written on a plane");
  await page.getByRole("textbox", { name: "New task" }).press("Enter");
  await expect(page.getByRole("checkbox", { name: "Written on a plane" })).toBeVisible();
  await context.setOffline(false);
});
