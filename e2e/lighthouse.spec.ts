import { chromium, expect, test } from "@playwright/test";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";

const PORT = 9334;

const BUDGETS = [
  { path: "", desktop: true, performance: 0.9, kilobytes: 280 },
  { path: "", desktop: false, performance: 0.8, kilobytes: 280 },
  { path: "?list=today", desktop: true, performance: 0.9, kilobytes: 280 },
];

test.describe.configure({ mode: "serial" });

for (const budget of BUDGETS) {
  test(`stays within budget on /${budget.path} (${budget.desktop ? "desktop" : "mobile"})`, async ({
    baseURL,
  }, testInfo) => {
    test.setTimeout(120_000);
    const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
    try {
      const result = await lighthouse(
        `${baseURL}${budget.path}`,
        { port: PORT, output: "html", logLevel: "error" },
        budget.desktop ? desktopConfig : undefined,
      );
      const report = result?.lhr;
      if (typeof result?.report === "string") {
        await testInfo.attach("lighthouse-report.html", { body: result.report, contentType: "text/html" });
      }
      expect(report?.runtimeError).toBeUndefined();
      // The score of a Lighthouse category, or 0
      const score = (category: string) => report?.categories[category]?.score ?? 0;
      // The failed audits of a category, the weighted ones unless asked
      const failing = (category: string, includeUnweighted = false) =>
        (report?.categories[category]?.auditRefs ?? [])
          .filter((ref) => (includeUnweighted || ref.weight > 0) && report?.audits[ref.id]?.score === 0)
          .map((ref) => ref.id);
      expect.soft(score("performance"), "performance").toBeGreaterThanOrEqual(budget.performance);
      expect.soft(score("accessibility"), "accessibility").toBe(1);
      expect.soft(failing("accessibility", true), "accessibility audits").toEqual([]);
      expect.soft(score("best-practices"), "best practices").toBe(1);
      expect.soft(failing("best-practices"), "best practices audits").toEqual([]);
      expect.soft(score("seo"), "seo").toBe(1);
      expect
        .soft(report?.audits["total-byte-weight"]?.numericValue ?? Infinity, "total bytes")
        .toBeLessThanOrEqual(budget.kilobytes * 1024);
    } finally {
      await browser.close();
    }
  });
}
