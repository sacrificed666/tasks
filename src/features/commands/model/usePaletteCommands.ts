import { flushSync } from "react-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { LIST_ICONS } from "@/features/lists/model/listIcons";
import { LISTS, projectView } from "@/features/lists/model/lists";
import { selectList, selectSort } from "@/features/lists/model/selectors";
import { SORT_MODES } from "@/features/lists/model/sort";
import { detailsOpened, listChanged, overlayOpened, queryChanged, sortChanged } from "@/features/lists/model/viewSlice";
import { splitProjectName, type Project } from "@/features/projects/model/project";
import { selectProjects } from "@/features/projects/model/selectors";
import { selectSettings } from "@/features/settings/model/selectors";
import { EFFECTS, resolveEffects } from "@/features/settings/model/settings";
import {
  accentChanged,
  appearanceChanged,
  backdropChanged,
  effectsChanged,
  glassChanged,
} from "@/features/settings/model/settingsSlice";
import { ACCENTS, APPEARANCES, BACKDROPS, GLASS_STYLES } from "@/features/settings/model/theme";
import { changeLocale } from "@/features/settings/model/thunks";
import { selectTasks } from "@/features/tasks/model/selectors";
import { COMPOSER_INPUT_ID } from "@/features/tasks/ui/ids";
import { useToday } from "@/shared/hooks/useToday";
import { LOCALE_INFO, LOCALES, type Locale } from "@/shared/i18n/locales";
import { useI18n } from "@/shared/i18n/useI18n";
import { describeDueDate } from "@/shared/lib/date";
import { fuzzyScore } from "@/shared/lib/text";
import type { IconName } from "@/shared/ui/Icon/icons";

import { rankCommands } from "./rank";
import { useTaskCommands } from "./useTaskCommands";

export type CommandGroup = "actions" | "lists" | "projects" | "tasks" | "sort" | "appearance" | "language";

export interface PaletteCommand {
  id: string;
  group: CommandGroup;
  label: string;
  keywords?: string;
  icon: IconName;
  flag?: Locale;
  project?: Project;
  hint?: string;
  current?: boolean;
  run: () => void;
}

const GROUP_ORDER: readonly CommandGroup[] = [
  "actions",
  "lists",
  "projects",
  "tasks",
  "sort",
  "appearance",
  "language",
];
const TASK_LIMIT = 8;
const APPEARANCE_ICONS = { system: "monitor", light: "sun", dark: "moon" } as const satisfies Record<string, IconName>;

// Ranked palette commands for a trimmed query, and a search for the query itself
export const usePaletteCommands = (query: string) => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t, intlLocale } = useI18n();
  const list = useAppSelector(selectList);
  const sort = useAppSelector(selectSort);
  const settings = useAppSelector(selectSettings);
  const tasks = useAppSelector(selectTasks);
  const projects = useAppSelector(selectProjects);
  const taskCommands = useTaskCommands();

  // Opens a list with the quick add field and focuses it
  const focusComposer = () => {
    if (list === "completed") flushSync(() => dispatch(listChanged("all")));
    document.getElementById(COMPOSER_INPUT_ID)?.focus();
  };

  const actionCommands: PaletteCommand[] = [
    { id: "new-task", group: "actions", label: t("palette.newTask"), icon: "plus", hint: "N", run: focusComposer },
    {
      id: "new-project",
      group: "actions",
      label: t("palette.newProject"),
      keywords: "list folder",
      icon: "folder",
      run: () => dispatch(overlayOpened({ kind: "project", projectId: null })),
    },
    ...taskCommands
      .filter((command) => !command.disabled)
      .map(({ id, label, icon, hint, keywords, run }): PaletteCommand => ({
        id,
        group: "actions",
        label,
        icon,
        hint,
        keywords,
        run,
      })),
  ];

  const foundTasks: PaletteCommand[] = query
    ? tasks
        .flatMap((task) => {
          const score = fuzzyScore(query, task.title) ?? (task.notes ? fuzzyScore(query, task.notes) : null);
          return score === null ? [] : [{ task, score }];
        })
        .toSorted((a, b) => b.score - a.score)
        .slice(0, TASK_LIMIT)
        .map(({ task }) => ({
          id: `task-${task.id}`,
          group: "tasks",
          label: task.title,
          keywords: task.notes,
          icon: task.completed ? "circleCheck" : task.important ? "star" : "list",
          hint: task.dueDate ? describeDueDate(task.dueDate, today, intlLocale).label : undefined,
          run: () => dispatch(detailsOpened(task.id)),
        }))
    : [];

  const commands: PaletteCommand[] = [
    ...actionCommands,
    ...LISTS.map((id, index): PaletteCommand => ({
      id: `list-${id}`,
      group: "lists",
      label: t("palette.goTo", { list: t(`lists.${id}`) }),
      keywords: id,
      icon: LIST_ICONS[id],
      hint: String(index + 1),
      current: id === list,
      run: () => dispatch(listChanged(id)),
    })),
    ...projects.map((project): PaletteCommand => ({
      id: `project-${project.id}`,
      group: "projects",
      label: t("palette.goToProject", { name: splitProjectName(project.name).label }),
      keywords: project.name,
      icon: "folder",
      project,
      current: projectView(project.id) === list,
      run: () => dispatch(listChanged(projectView(project.id))),
    })),
    ...foundTasks,
    ...SORT_MODES.map((mode): PaletteCommand => ({
      id: `sort-${mode}`,
      group: "sort",
      label: t("palette.sortBy", { mode: t(`sort.${mode}`) }),
      icon: "sort",
      current: mode === sort,
      run: () => dispatch(sortChanged(mode)),
    })),
    ...APPEARANCES.map((appearance): PaletteCommand => ({
      id: `appearance-${appearance}`,
      group: "appearance",
      label: t("palette.scheme", { mode: t(`settings.theme.${appearance}`) }),
      keywords: "theme",
      icon: APPEARANCE_ICONS[appearance],
      current: appearance === settings.appearance,
      run: () => dispatch(appearanceChanged(appearance)),
    })),
    ...ACCENTS.map((accent): PaletteCommand => ({
      id: `accent-${accent}`,
      group: "appearance",
      label: t("palette.accent", { accent: t(`accent.${accent}`) }),
      keywords: "colour color theme",
      icon: "palette",
      current: accent === settings.accent,
      run: () => dispatch(accentChanged(accent)),
    })),
    ...BACKDROPS.map((backdrop): PaletteCommand => ({
      id: `backdrop-${backdrop}`,
      group: "appearance",
      label: t("palette.background", { name: t(`background.${backdrop}`) }),
      keywords: "wallpaper theme",
      icon: "image",
      current: backdrop === settings.backdrop,
      run: () => dispatch(backdropChanged(backdrop)),
    })),
    ...GLASS_STYLES.map((glass): PaletteCommand => ({
      id: `glass-${glass}`,
      group: "appearance",
      label: t("palette.glass", { mode: t(`glass.${glass}`) }),
      keywords: "transparency contrast",
      icon: "sparkles",
      current: glass === settings.glass,
      run: () => dispatch(glassChanged(glass)),
    })),
    {
      id: "settings",
      group: "appearance",
      label: t("palette.openSettings"),
      keywords: "preferences options",
      icon: "sliders",
      run: () => dispatch(overlayOpened({ kind: "settings" })),
    },
    ...EFFECTS.map((effects): PaletteCommand => ({
      id: `effects-${effects}`,
      group: "appearance",
      label: t("palette.effects", { mode: t(`settings.effects.${effects}`) }),
      keywords: `performance ${resolveEffects(effects)}`,
      icon: "bolt",
      current: effects === settings.effects,
      run: () => dispatch(effectsChanged(effects)),
    })),
    ...LOCALES.map((code): PaletteCommand => ({
      id: `locale-${code}`,
      group: "language",
      label: t("palette.locale", { language: LOCALE_INFO[code].name }),
      keywords: `language ${code}`,
      icon: "globe",
      flag: code,
      current: code === settings.locale,
      run: () => void dispatch(changeLocale(code)),
    })),
  ];

  const search: PaletteCommand | null = query
    ? {
        id: "search",
        group: "actions",
        label: t("palette.searchFor", { query }),
        icon: "search",
        hint: "/",
        run: () => dispatch(queryChanged(query)),
      }
    : null;

  return { groups: rankCommands(commands, query, GROUP_ORDER), search };
};
