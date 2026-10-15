import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const dist = new URL("../dist/", import.meta.url).pathname;

// Every file below a directory
const walk = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const failures = [];
// Collects a failed check instead of stopping at the first one
const expect = (condition, message) => {
  if (!condition) failures.push(message);
};

const html = readFileSync(join(dist, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(join(dist, "manifest.webmanifest"), "utf8"));
const files = walk(dist);

expect(html.includes('http-equiv="Content-Security-Policy"'), "index.html has no Content-Security-Policy meta tag");
expect(html.includes("require-trusted-types-for"), "the Content-Security-Policy does not enforce Trusted Types");
expect(
  !/<script(?![^>]*\b(?:src=|type="application\/ld\+json"))[^>]*>/u.test(html),
  "index.html contains an inline script",
);
expect(
  files.some((file) => file.endsWith("sw.js")),
  "the service worker was not generated",
);
expect(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length > 0, "the web manifest has no shortcuts");
expect(manifest.share_target?.action === manifest.scope, "the web manifest has no share target");
expect(
  ["wide", "narrow"].every((formFactor) => manifest.screenshots?.some((shot) => shot.form_factor === formFactor)),
  "the web manifest needs a wide and a narrow screenshot",
);
expect(html.includes('rel="canonical"'), "index.html has no canonical link");
expect(html.includes('property="og:image"'), "index.html has no social preview image");

const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)?.[1];
let parsedData = null;
try {
  parsedData = structuredData ? JSON.parse(structuredData) : null;
} catch {
  parsedData = null;
}
expect(parsedData?.["@type"] === "WebApplication", "index.html has no valid structured data");

// A text file of the build, or an empty string when it is missing
const readText = (name) => {
  try {
    return readFileSync(join(dist, name), "utf8");
  } catch {
    return "";
  }
};

const canonical = html.match(/<link rel="canonical" href="([^"]+)"/u)?.[1] ?? "";
expect(!html.includes("%"), "index.html still contains a placeholder of vite.config.ts");
expect(readText("robots.txt").includes(`Sitemap: ${canonical}sitemap.xml`), "robots.txt does not point to the sitemap");
expect(readText("sitemap.xml").includes(`<loc>${canonical}</loc>`), "the sitemap does not list the canonical address");
const security = readText(".well-known/security.txt");
const expires = Date.parse(/^Expires: (?<date>.+)$/mu.exec(security)?.groups?.date ?? "");
expect(security.startsWith("Contact: ") && expires > Date.now(), "security.txt is missing or expired");

for (const asset of ["og-image.jpg", ...(manifest.screenshots ?? []).map((shot) => shot.src)]) {
  expect(
    files.some((file) => relative(dist, file) === asset),
    `${asset} is referenced but missing from the build`,
  );
}

// Bytes as kilobytes for the report
const formatSize = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;

const assets = files
  .filter((file) => /\.(js|css|html|svg|webmanifest)$/u.test(file))
  .map((file) => {
    const content = readFileSync(file);
    return { name: relative(dist, file), size: content.length, gzip: gzipSync(content).length };
  })
  .toSorted((a, b) => b.gzip - a.gzip);

const total = assets.reduce((sum, asset) => sum + asset.gzip, 0);

const lines = [
  "### 📦 Build output",
  "",
  "| File | Size | Gzip |",
  "| --- | ---: | ---: |",
  ...assets.map((asset) => `| \`${asset.name}\` | ${formatSize(asset.size)} | ${formatSize(asset.gzip)} |`),
  `| **Total** | | **${formatSize(total)}** |`,
  "",
  failures.length === 0
    ? "✅ Content Security Policy, Trusted Types, service worker, web manifest, search metadata, robots rules, sitemap and security.txt are in place."
    : failures.map((failure) => `❌ ${failure}`).join("\n"),
];

process.stdout.write(`${lines.join("\n")}\n`);
if (failures.length > 0) process.exitCode = 1;
