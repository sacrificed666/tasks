import { expect, test } from "@playwright/test";

import { seed } from "./helpers";

test("adds a task with quick add and keeps it after a reload", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("No tasks yet")).toBeVisible();
  const composer = page.getByRole("textbox", { name: "New task" });
  await composer.fill("Call mom tomorrow !");
  await expect(page.getByRole("button", { name: "Due date: Tomorrow" })).toBeVisible();
  await composer.press("Enter");
  await expect(page.getByRole("checkbox", { name: "Call mom" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Call mom" })).toBeVisible();

  await page.goto("./?list=important");
  await expect(page.getByRole("heading", { level: 1, name: "Important" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Call mom" })).toBeVisible();
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
});

test("completes a task, undoes it with the keyboard and keeps it after a reload", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  await page.goto("./");
  const task = page.getByRole("checkbox", { name: "Read a book" });
  await task.check();
  await expect(task).toBeChecked();
  await page.keyboard.press("ControlOrMeta+Z");
  await expect(page.getByRole("checkbox", { name: "Read a book" })).not.toBeChecked();

  await page.getByRole("checkbox", { name: "Read a book" }).check();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Read a book" })).toBeChecked();
});

test("saves a completion that is still animating when the page is reloaded", async ({ page }) => {
  await seed(page);
  await page.goto("./");
  await page.getByRole("checkbox", { name: "Dentist appointment" }).check();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Dentist appointment" })).toBeChecked();
});

test("keeps open tabs in sync", async ({ page, context }) => {
  await page.goto("./");
  const other = await context.newPage();
  await other.goto("./");

  await page.getByRole("textbox", { name: "New task" }).fill("Pack the suitcase");
  await page.getByRole("textbox", { name: "New task" }).press("Enter");
  await expect(other.getByRole("checkbox", { name: "Pack the suitcase" })).toBeVisible();
});

test("opens a list from an app shortcut and adds shared text", async ({ page }) => {
  await page.goto("./?title=Read%20the%20article&url=https%3A%2F%2Fexample.com");
  await expect(page.getByRole("checkbox", { name: "Read the article" })).toBeVisible();
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
});
