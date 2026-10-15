import { fileURLToPath, URL } from "node:url";

import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import packageJson from "./package.json" with { type: "json" };

const base = "/";
const siteUrl = "https://tasks.sacrificed.me/";
const description =
  "A free, private task planner with projects, tags, smart lists, repeats and a calendar. Works offline in ten languages and keeps your tasks on your device.";

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "require-trusted-types-for 'script'",
  "trusted-types default",
].join("; ");

// Adds the CSP and the referrer policy to the built page
const securityHeaders = (): Plugin => ({
  name: "security-headers",
  apply: "build",
  transformIndexHtml: {
    order: "post",
    handler: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: contentSecurityPolicy },
        injectTo: "head-prepend",
      },
      { tag: "meta", attrs: { name: "referrer", content: "strict-origin-when-cross-origin" }, injectTo: "head" },
    ],
  },
});

const repository = packageJson.repository.url.replace(/^git\+/u, "").replace(/\.git$/u, "");
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// The security contact, valid for a year from the build
const securityTxt = () =>
  [
    `Contact: ${repository}/security/advisories/new`,
    `Expires: ${new Date(Date.now() + YEAR_MS).toISOString()}`,
    "Preferred-Languages: en, uk",
    `Canonical: ${siteUrl}.well-known/security.txt`,
    `Policy: ${repository}/security/policy`,
    "",
  ].join("\n");

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}sitemap.xml\n`;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
  </url>
</urlset>
`;

// Fills in index.html and writes robots.txt, the sitemap and security.txt
const siteMeta = (): Plugin => ({
  name: "site-meta",
  transformIndexHtml: {
    order: "pre",
    handler: (html) => html.replaceAll("%APP_DESCRIPTION%", description).replaceAll("%SITE_URL%", siteUrl),
  },
  generateBundle() {
    this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });
    this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemap });
    this.emitFile({ type: "asset", fileName: ".well-known/security.txt", source: securityTxt() });
  },
});

export default defineConfig({
  base,
  define: {
    "import.meta.env.APP_VERSION": JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Libraries change less often than the app, so an update downloads only the app
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 2 },
            { name: "vendor", test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    // React Compiler for the app; unit tests run the plain source, like the other apps
    ...(process.env.VITEST ? [] : [babel({ presets: [reactCompilerPreset()] })]),
    siteMeta(),
    securityHeaders(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        id: base,
        name: "Tasks",
        short_name: "Tasks",
        description,
        lang: "en",
        dir: "ltr",
        start_url: base,
        scope: base,
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "any",
        categories: ["productivity", "utilities"],
        theme_color: "#070a14",
        background_color: "#070a14",
        shortcuts: [
          {
            name: "New task",
            short_name: "New",
            url: `${base}?action=new`,
            icons: [{ src: "pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          { name: "Today", url: `${base}?list=today` },
          { name: "Important", url: `${base}?list=important` },
        ],
        share_target: {
          action: base,
          method: "GET",
          enctype: "application/x-www-form-urlencoded",
          params: { title: "title", text: "text", url: "url" },
        },
        screenshots: [
          {
            src: "screenshots/wide.jpg",
            sizes: "1280x800",
            type: "image/jpeg",
            form_factor: "wide",
            label: "Smart lists, projects, the task list and the overview",
          },
          {
            src: "screenshots/narrow.jpg",
            sizes: "780x1688",
            type: "image/jpeg",
            form_factor: "narrow",
            label: "Today with overdue tasks and the tab bar",
          },
        ],
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,avif,woff2}"],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
