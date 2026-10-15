// Takes the pictures of the README and the docs from a running app
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

import { chromium } from "@playwright/test";

// Where the app runs, where the pictures go and the moment they show
const BASE = process.argv[2] ?? "http://localhost:4173/";
const OUT = new URL("../docs/images/", import.meta.url);
const NOW = new Date("2026-10-09T10:00:00+03:00");
const DAY = 24 * 60 * 60 * 1000;
// How long transitions, blurs and fonts get before a picture
const SETTLE = 1200;
const CREATED = Date.parse("2026-10-01T10:00:00+03:00");
const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const BACKDROPS = [
  ["aurora", "blue", "Aurora"],
  ["spectrum", "pink", "Spectrum"],
  ["sunset", "sunset", "Sunset"],
  ["ocean", "mint", "Ocean"],
  ["nebula", "violet", "Nebula"],
  ["plain", "graphite", "Plain"],
];

// The date key a number of days from the day of the pictures
const dayKey = (offset) =>
  new Date(NOW.getTime() + offset * DAY).toLocaleDateString("sv-SE", { timeZone: "Europe/Kyiv" });

// A moment a number of days before the pictures, at the given hour in Kyiv
const daysAgo = (days, hour) => Date.parse(`${dayKey(-days)}T${String(hour).padStart(2, "0")}:00:00+03:00`);

// A task with every field, from the fields that matter
const task = (id, title, fields = {}) => ({
  id,
  title,
  completed: false,
  important: false,
  dueDate: null,
  repeat: null,
  repeatAnchor: null,
  projectId: null,
  tags: [],
  notes: "",
  subtasks: [],
  createdAt: CREATED,
  updatedAt: CREATED,
  completedAt: null,
  ...fields,
});

// A task finished a number of days before the pictures
const done = (id, title, days, fields = {}) =>
  task(id, title, { completed: true, completedAt: daysAgo(days, 9), ...fields });

const DATA = {
  projects: [
    { id: "work", name: "Work", color: "blue", createdAt: CREATED, updatedAt: CREATED },
    { id: "home", name: "🏠 Home", color: "orange", createdAt: CREATED, updatedAt: CREATED },
    { id: "trip", name: "Trip to Lviv", color: "green", createdAt: CREATED, updatedAt: CREATED },
  ],
  tasks: [
    task("train", "Book train tickets to Lviv", {
      important: true,
      dueDate: dayKey(1),
      projectId: "trip",
      tags: ["#travel"],
      notes: "Window seats if possible, the night train is fine too.",
      subtasks: [
        { id: "train-1", title: "Pick dates", completed: true },
        { id: "train-2", title: "Compare prices", completed: false },
        { id: "train-3", title: "Book seats", completed: false },
      ],
    }),
    task("report", "Prepare the quarterly report", { dueDate: dayKey(0), projectId: "work", tags: ["#work"] }),
    task("dentist", "Call the dentist", { dueDate: dayKey(-1) }),
    task("groceries", "Buy groceries", { projectId: "home", notes: "Milk, eggs, apples and coffee." }),
    task("habits", "Read “Atomic Habits”", { tags: ["#home"] }),
    task("retro", "Team retro notes", { dueDate: dayKey(2), projectId: "work", tags: ["#work"] }),
    task("passport", "Renew passport", { dueDate: dayKey(5), projectId: "trip" }),
    task("plants", "Water the plants", {
      dueDate: dayKey(0),
      repeat: "weekly",
      repeatAnchor: dayKey(0),
      projectId: "home",
    }),
    task("rent", "Pay rent", { dueDate: dayKey(-3), repeat: "monthly", repeatAnchor: dayKey(-3), projectId: "home" }),
    task("sprint", "Plan the sprint", { dueDate: dayKey(12), projectId: "work" }),
    done("invoice", "Send the invoice", 4, { projectId: "work" }),
    done("gift", "Buy a birthday gift", 3),
    done("desk", "Clean the desk", 3),
    done("haircut", "Book a haircut", 1),
    done("reply", "Reply to Anna", 0),
  ],
};

// The preferences of a picture on top of the defaults
const preferences = (settings) => ({
  appearance: "dark",
  accent: "blue",
  backdrop: "aurora",
  glass: "clear",
  locale: "en",
  effects: "full",
  list: "all",
  sort: "manual",
  showCompleted: false,
  ...settings,
});

// Saves a picture next to the others
const save = (name, buffer) => writeFile(new URL(name, OUT), buffer);

// A page with the tasks, the settings and the clock of the pictures
const open = async (browser, device, settings) => {
  const context = await browser.newContext({
    ...device,
    locale: "en-GB",
    timezoneId: "Europe/Kyiv",
    serviceWorkers: "block",
    colorScheme: settings.appearance === "light" ? "light" : "dark",
  });
  await context.clock.setFixedTime(NOW);
  await context.addInitScript(
    ({ data, prefs }) => {
      localStorage.setItem("tasks/data", JSON.stringify(data));
      localStorage.setItem("tasks/preferences", JSON.stringify(prefs));
    },
    { data: DATA, prefs: preferences(settings) },
  );
  const page = await context.newPage();
  await page.goto(BASE);
  await page.getByRole("checkbox", { name: "Book train tickets to Lviv" }).or(page.getByRole("main")).first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page;
};

// Takes a picture of the whole window and closes it
const shoot = async (page, name, options = {}) => {
  await page.waitForTimeout(SETTLE);
  await save(name, await page.screenshot({ type: "jpeg", quality: 85, ...options }));
  await page.context().close();
};

// Opens the details of the task about train tickets with the keyboard
const openTrainDetails = async (page) => {
  await page.getByRole("checkbox", { name: "Book train tickets to Lviv" }).focus();
  await page.keyboard.press("i");
  await page.getByText("Window seats if possible").first().waitFor();
  await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : null));
};

// A picture of an element with some room around it
const around = async (page, locator, room) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Nothing to take a picture of");
  return page.screenshot({
    type: "jpeg",
    quality: 85,
    clip: { x: box.x - room, y: box.y - room, width: box.width + room * 2, height: box.height + room * 2 },
  });
};

// Drags a finger across a row without letting go, so the swipe stays visible
const holdSwipe = async (page, title, distance) => {
  const box = await page.getByRole("checkbox", { name: title }).boundingBox();
  if (!box) throw new Error(`No row for ${title}`);
  const session = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2;
  const start = box.x + 120;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start, y }] });
  // Small steps one after another, like a finger, so the row takes the swipe
  const steps = [10, 20, 40, 60, 80, 100, 120].filter((step) => step <= distance);
  await steps.reduce(
    (previous, step) =>
      previous.then(() =>
        session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start + step, y }] }),
      ),
    Promise.resolve(),
  );
};

const SHOTS = [
  // The overview on a wide screen in both appearances
  async (browser) => shoot(await open(browser, DESKTOP, { appearance: "light" }), "desktop-light.jpg"),
  async (browser) => shoot(await open(browser, DESKTOP, { appearance: "dark" }), "desktop-dark.jpg"),
  // The details of a task in the inspector column
  async (browser) => {
    const page = await open(browser, DESKTOP, { appearance: "dark" });
    await openTrainDetails(page);
    await shoot(page, "desktop-details.jpg");
  },
  // A project with its own colour
  async (browser) =>
    shoot(
      await open(browser, DESKTOP, { appearance: "dark", accent: "sunset", backdrop: "sunset", list: "project:home" }),
      "desktop-project.jpg",
    ),
  // The details as a dialog below 1240 px
  async (browser) => {
    const page = await open(browser, { ...DESKTOP, viewport: { width: 1100, height: 900 } }, { appearance: "dark" });
    await openTrainDetails(page);
    const dialog = page.getByRole("dialog");
    await page.waitForTimeout(SETTLE);
    await save("details.jpg", await dialog.screenshot({ type: "jpeg", quality: 85 }));
    await page.context().close();
  },
  // The context menu of a task
  async (browser) => {
    const page = await open(browser, DESKTOP, { appearance: "dark" });
    const row = page.getByRole("checkbox", { name: "Prepare the quarterly report" });
    const box = await row.boundingBox();
    if (!box) throw new Error("No row for the report");
    await page.mouse.click(box.x + 314, box.y + 4, { button: "right" });
    await page.getByRole("menu").waitFor();
    await shoot(page, "menu.jpg", { clip: { x: box.x - 36, y: box.y - 40, width: 658, height: 498 } });
  },
  // The command palette searching for go
  async (browser) => {
    const page = await open(browser, DESKTOP, { appearance: "dark" });
    await page.keyboard.press("ControlOrMeta+K");
    const palette = page.getByRole("dialog", { name: "Command palette" });
    await palette.getByRole("combobox").fill("go");
    await page.waitForTimeout(SETTLE);
    await save("palette.jpg", await around(page, palette, 24));
    await page.context().close();
  },
  // The settings with a violet accent over the Nebula background
  async (browser) => {
    const page = await open(browser, DESKTOP, { appearance: "dark", accent: "violet", backdrop: "nebula" });
    await page.getByRole("button", { name: "Settings" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Settings" });
    await dialog.waitFor();
    await page.waitForTimeout(SETTLE);
    await save("settings.jpg", await around(page, dialog, 24));
    await page.context().close();
  },
  // Phones: German, today in the dark, the lists sheet, a swipe in Ukrainian
  async (browser) => shoot(await open(browser, PHONE, { appearance: "light", locale: "de" }), "mobile-light.jpg"),
  async (browser) => shoot(await open(browser, PHONE, { appearance: "dark", list: "today" }), "mobile-dark.jpg"),
  async (browser) => {
    const page = await open(browser, PHONE, { appearance: "dark" });
    await page.getByRole("button", { name: "Lists" }).click();
    await page.getByRole("dialog").waitFor();
    await shoot(page, "mobile-lists.jpg");
  },
  async (browser) => {
    const page = await open(browser, PHONE, { appearance: "dark", locale: "uk" });
    await holdSwipe(page, "Buy groceries", 120);
    await shoot(page, "mobile-swipe-uk.jpg");
  },
];

// The app in each background, one after another
const backdropTiles = async (browser, [next, ...rest], tiles = []) => {
  if (!next) return tiles;
  const [backdrop, accent, label] = next;
  const page = await open(browser, { ...DESKTOP, deviceScaleFactor: 1 }, { appearance: "dark", accent, backdrop });
  await page.waitForTimeout(SETTLE);
  const image = (await page.screenshot({ type: "jpeg", quality: 90 })).toString("base64");
  await page.context().close();
  return backdropTiles(browser, rest, [...tiles, { image, label }]);
};

// The six backgrounds side by side, each with its name
const backgrounds = async (browser) => {
  const tiles = await backdropTiles(browser, BACKDROPS);
  const context = await browser.newContext({ viewport: { width: 1464, height: 640 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setContent(`<!doctype html>
    <style>
      body { margin: 0; background: #07080d; font: 700 15px system-ui, sans-serif; }
      main { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; padding: 8px; }
      figure { position: relative; margin: 0; overflow: hidden; border: 1px solid #ffffff1f; border-radius: 14px; }
      img { display: block; width: 100%; }
      figcaption { position: absolute; bottom: 10px; left: 10px; padding: 5px 12px; border-radius: 999px;
        background: #0b0d14cc; color: #fff; }
    </style>
    <main>${tiles.map(({ image, label }) => `<figure><img src="data:image/jpeg;base64,${image}"><figcaption>${label}</figcaption></figure>`).join("")}</main>`);
  await save("backgrounds.jpg", await page.locator("main").screenshot({ type: "jpeg", quality: 85 }));
  await context.close();
};

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  await SHOTS.reduce((previous, shot) => previous.then(() => shot(browser)), Promise.resolve());
  await backgrounds(browser);
  process.stdout.write(`Saved ${SHOTS.length + 1} pictures in docs/images.\n`);
} finally {
  await browser.close();
}
