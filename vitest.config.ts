import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      // One jsdom per worker with each test file in its own context: about twice as fast
      pool: "vmThreads",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./src/test/setup.ts"],
      restoreMocks: true,
      unstubGlobals: true,
      unstubEnvs: true,
      coverage: {
        provider: "v8",
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/app/main.tsx", "src/test/**", "src/**/*.test.{ts,tsx}"],
        reporter: ["text", "html", "json-summary"],
        thresholds: {
          statements: 94,
          branches: 89,
          functions: 94,
          lines: 96,
        },
      },
    },
  }),
);
