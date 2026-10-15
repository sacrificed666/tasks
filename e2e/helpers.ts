import { expect, type Locator, type Page } from "@playwright/test";

// A Mac browser, which gets the full effects by default
export const MAC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

interface SeedTask {
  title: string;
  due?: number;
  important?: boolean;
  completed?: boolean;
  project?: string;
  notes?: string;
  subtasks?: { title: string; completed?: boolean }[];
}

interface SeedProject {
  id: string;
  name: string;
  color: string;
}

const SAMPLE_PROJECTS: SeedProject[] = [
  { id: "work", name: "Work", color: "blue" },
  { id: "home", name: "🏠 Home", color: "green" },
];

const SAMPLE_TASKS: SeedTask[] = [
  { title: "Send the invoice", due: -2, important: true, project: "work" },
  {
    title: "Daily standup",
    due: 0,
    project: "work",
    notes: "Room 4",
    subtasks: [{ title: "Agenda", completed: true }, { title: "Notes" }],
  },
  { title: "Water the plants #home", due: 0, project: "home" },
  { title: "Dentist appointment", due: 3 },
  { title: "Book flights for the trip", due: 12, important: true },
  { title: "Read a book" },
  { title: "Buy milk", completed: true, project: "home" },
];

// Stores sample tasks and projects before the first load of a test
export const seed = async (page: Page, tasks: SeedTask[] = SAMPLE_TASKS, projects: SeedProject[] = SAMPLE_PROJECTS) => {
  await page.addInitScript(
    ({ tasks: entries, projects: groups }) => {
      if (sessionStorage.getItem("e2e-seeded")) return;
      sessionStorage.setItem("e2e-seeded", "1");
      const now = Date.now();
      const data = {
        tasks: entries.map((entry, index) => ({
          id: `seed-${index}`,
          title: entry.title,
          completed: entry.completed ?? false,
          important: entry.important ?? false,
          dueDate:
            entry.due === undefined
              ? null
              : new Date(new Date().setDate(new Date().getDate() + entry.due)).toLocaleDateString("sv-SE"),
          projectId: entry.project ?? null,
          notes: entry.notes ?? "",
          subtasks: (entry.subtasks ?? []).map((subtask, step) => ({
            id: `seed-${index}-${step}`,
            title: subtask.title,
            completed: subtask.completed ?? false,
          })),
          createdAt: now - index * 60_000,
          updatedAt: now - index * 60_000,
          completedAt: entry.completed ? now : null,
        })),
        projects: groups.map((group) => ({ ...group, createdAt: now, updatedAt: now })),
      };
      localStorage.setItem("tasks/data", JSON.stringify(data));
    },
    { tasks, projects },
  );
};

// Stores preferences before the first load of a test
export const preferences = async (page: Page, values: Record<string, string>) => {
  await page.addInitScript((settings) => {
    if (sessionStorage.getItem("e2e-preferences")) return;
    sessionStorage.setItem("e2e-preferences", "1");
    localStorage.setItem("tasks/preferences", JSON.stringify(settings));
  }, values);
};

// Opens the palette, pressing again until the app listens for the shortcut
export const openPalette = async (page: Page) => {
  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(async () => {
    if (!(await palette.isVisible())) await page.keyboard.press("ControlOrMeta+K");
    await expect(palette).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 20_000 });
  return palette;
};

// Runs a palette command by typing its name
export const runCommand = async (page: Page, command: string) => {
  const palette = await openPalette(page);
  await palette.getByRole("combobox").fill(command);
  await page.keyboard.press("Enter");
};

// The label of a radio option, which is what a visitor clicks
export const option = (page: Page, name: string | RegExp): Locator =>
  page.locator("label").filter({ has: page.getByRole("radio", { name, exact: true }) });

// Texts cut off by their own box, skipping transparent and hidden ones
export const clippedText = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((element) => {
        if (!element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
        const box = element.getBoundingClientRect();
        if (box.width < 2 || box.height < 2) return false;
        const style = getComputedStyle(element);
        if (!["hidden", "clip"].includes(style.overflowX) && style.textOverflow !== "ellipsis") return false;
        const text = [...element.childNodes].some(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        return text && element.scrollWidth > element.clientWidth;
      })
      .map((element) => element.textContent.trim()),
  );
