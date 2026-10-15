import { nanoid } from "@reduxjs/toolkit";

import { isEntityId, isRecord, readTimestamp } from "@/shared/lib/guards";

export const PROJECT_COLORS = [
  "blue",
  "indigo",
  "violet",
  "pink",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "gray",
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

export interface Project {
  id: string;
  name: string;
  color: ProjectColor;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectDraft {
  name: string;
  color?: ProjectColor;
}

export const MAX_PROJECT_NAME_LENGTH = 40;
const MAX_PROJECTS = 200;

// Emoji offered for the project icon: work, home, health, leisure and the rest
export const PROJECT_EMOJI: readonly string[] =
  "💼 💻 📈 📝 📚 🎓 🎨 🧪 🏠 🛒 🍳 🧹 🪴 🐶 👶 🎁 💪 🏃 🧘 🩺 🌱 ☕ ✈️ 🏖️ 🚗 🎮 🎵 🎬 📷 ⚽ 💰 💡 🎯 ⭐ 🔥 ❤️ 🎉 🚀 🔧".split(
    " ",
  );

const EMOJI = /^(?:\p{Extended_Pictographic}|\p{Regional_Indicator})/u;
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

// Whether a value is a project colour
const isProjectColor = (value: unknown): value is ProjectColor =>
  typeof value === "string" && (PROJECT_COLORS as readonly string[]).includes(value);

// A project name on one line within the length limit
export const normalizeProjectName = (value: string) =>
  Array.from(value.replaceAll(/\s+/g, " ").trim()).slice(0, MAX_PROJECT_NAME_LENGTH).join("").trim();

// The next colour in turn for a new project
export const suggestProjectColor = (count: number): ProjectColor =>
  PROJECT_COLORS[count % PROJECT_COLORS.length] ?? "blue";

// A new project
export const createProject = ({ name, color = "blue" }: ProjectDraft, now: number, id: string = nanoid()): Project => ({
  id,
  name: normalizeProjectName(name),
  color,
  createdAt: now,
  updatedAt: now,
});

// A leading emoji and the rest of a project name
export const splitProjectName = (name: string): { emoji: string | null; label: string } => {
  const [first] = graphemes.segment(name);
  if (!first || !EMOJI.test(first.segment)) return { emoji: null, label: name };
  const label = name.slice(first.segment.length).trim();
  return label ? { emoji: first.segment, label } : { emoji: null, label: name };
};

// A project name from an optional emoji and the rest of the name
export const joinProjectName = (emoji: string | null, label: string) =>
  normalizeProjectName(emoji ? `${emoji} ${label}` : label);

// Valid projects of a document, without duplicates
export const parseProjects = (input: unknown, now: number = Date.now()): Project[] => {
  const list = isRecord(input) && Array.isArray(input.projects) ? input.projects : [];
  const seen = new Set<string>();

  return list.slice(0, MAX_PROJECTS).flatMap((entry): Project[] => {
    if (!isRecord(entry) || !isEntityId(entry.id) || seen.has(entry.id)) return [];
    const name = typeof entry.name === "string" ? normalizeProjectName(entry.name) : "";
    if (!name) return [];
    seen.add(entry.id);

    const createdAt = readTimestamp(entry.createdAt, now);
    return [
      {
        id: entry.id,
        name,
        color: isProjectColor(entry.color) ? entry.color : "blue",
        createdAt,
        updatedAt: Math.max(readTimestamp(entry.updatedAt, createdAt), createdAt),
      },
    ];
  });
};
