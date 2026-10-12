import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

const CI = Boolean(process.env.CI);
// Safari on Linux, which gets the effects of every system but Apple's
const LINUX_SAFARI =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
// Linux WebKit paints without a GPU, so it gets the effects of Linux Safari
const WEBKIT = process.platform === "linux" ? { userAgent: LINUX_SAFARI } : {};
// Screenshots are compared on the Linux runners of CI only, see docs/testing.md
const VISUAL = CI || Boolean(process.env.VISUAL);
const SCREENSHOTS = "e2e/__screenshots__";
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}/`;
// CI tests the bundle of the build job instead of building it again
const PREBUILT = process.env.E2E_PREBUILT === "true";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  snapshotPathTemplate: `${SCREENSHOTS}/{testFilePath}/{arg}{ext}`,
  // Until the first screenshots are committed, the visual tests only load the pages
  ignoreSnapshots: !existsSync(SCREENSHOTS),
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
  use: {
    baseURL: BASE_URL,
    locale: "en-GB",
    timezoneId: "Europe/Kyiv",
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", testIgnore: /lighthouse|visual/, use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", testIgnore: /lighthouse|visual/, use: { ...devices["Pixel 7"] } },
    { name: "webkit", testIgnore: /lighthouse|visual/, use: { ...devices["Desktop Safari"], ...WEBKIT } },
    ...(VISUAL ? [{ name: "visual", testMatch: /visual\.spec\.ts/, use: { ...devices["Desktop Chrome"] } }] : []),
    {
      name: "lighthouse",
      testMatch: /lighthouse\.spec\.ts/,
      dependencies: ["desktop", "mobile", ...(VISUAL ? ["visual"] : [])],
    },
  ],
  webServer: {
    command: `${PREBUILT ? "" : "npm run build && "}npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    timeout: 300_000,
    reuseExistingServer: !CI,
  },
});
