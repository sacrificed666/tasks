import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";

import { LOCALE_INFO } from "../src/shared/i18n/locales.ts";

const source = new URL("../node_modules/country-flag-icons/3x2/", import.meta.url);
const target = new URL("../public/flags/", import.meta.url);
const flags = [...new Set(Object.values(LOCALE_INFO).map((locale) => locale.flag))].toSorted();

mkdirSync(target, { recursive: true });
for (const file of readdirSync(target)) {
  if (!flags.includes(file.replace(/\.svg$/u, ""))) rmSync(new URL(file, target));
}
for (const flag of flags) copyFileSync(new URL(`${flag}.svg`, source), new URL(`${flag}.svg`, target));

process.stdout.write(`Copied ${flags.length} flags: ${flags.join(", ")}\n`);
