import { expect, test } from "@playwright/test";

const SITE_URL = "https://tasks.sacrificed.me/";

test.skip(({ isMobile }) => isMobile, "The markup for search engines is the same on every screen");

test("describes the app for search engines and link previews", async ({ page }) => {
  await page.goto("./");
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  expect(description).toMatch(/^A free, private task planner/u);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description ?? "");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", SITE_URL);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", SITE_URL);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${SITE_URL}og-image.jpg`);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  expect(await page.content()).not.toMatch(/%[A-Z_]+%/u);
});

test("describes the app with structured data", async ({ page }) => {
  await page.goto("./");
  const json = await page.locator('script[type="application/ld+json"]').textContent();
  const schema: unknown = JSON.parse(json ?? "null");
  expect(schema).toMatchObject({ "@type": "WebApplication", name: "Tasks", url: SITE_URL, isAccessibleForFree: true });
  expect(schema).toHaveProperty("screenshot", `${SITE_URL}screenshots/wide.jpg`);
});

test("serves the share image and every icon", async ({ request }) => {
  const files = [
    "og-image.jpg",
    "favicon.ico",
    "favicon.svg",
    "apple-touch-icon-180x180.png",
    "pwa-192x192.png",
    "pwa-512x512.png",
    "maskable-icon-512x512.png",
    "screenshots/wide.jpg",
    "screenshots/narrow.jpg",
  ];
  const responses = await Promise.all(files.map(async (file) => [file, (await request.get(file)).ok()] as const));
  expect(responses.filter(([, ok]) => !ok)).toEqual([]);
});

test("describes the app for installation", async ({ request }) => {
  const manifest: unknown = await (await request.get("manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ name: "Tasks", start_url: "/", scope: "/", display: "standalone" });
  expect(manifest).toHaveProperty(["icons", "3", "purpose"], "maskable");
});

test("allows crawling and lists the app in the sitemap", async ({ request }) => {
  const robots = await (await request.get("robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
  const sitemap = await (await request.get("sitemap.xml")).text();
  expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
});

test("names a security contact that has not expired", async ({ request }) => {
  const text = await (await request.get(".well-known/security.txt")).text();
  expect(text).toMatch(/^Contact: https:\/\/github\.com\/sacrificed666\/[\w-]+\/security\/advisories\/new$/mu);
  const expires = Date.parse(/^Expires: (?<date>.+)$/mu.exec(text)?.groups?.date ?? "");
  expect(expires).toBeGreaterThan(Date.now());
});
