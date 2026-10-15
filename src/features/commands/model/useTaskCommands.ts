import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { exportData, redo, selectHistory, undo } from "@/features/data/model/thunks";
import { formatMessage } from "@/features/notifications/model/format";
import { selectListCounts } from "@/features/tasks/model/selectors";
import { allTasksMarked } from "@/features/tasks/model/tasksSlice";
import { clearCompleted } from "@/features/tasks/model/thunks";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { isApplePlatform } from "@/shared/lib/keyboard";
import type { IconName } from "@/shared/ui/Icon/icons";

export type TaskCommandId = "undo" | "redo" | "toggle-all" | "clear" | "export";

export interface TaskCommand {
  id: TaskCommandId;
  label: string;
  icon: IconName;
  keywords?: string;
  hint?: string;
  disabled: boolean;
  run: () => void;
}

// Task commands shared by the palette and the actions menu
export const useTaskCommands = (): readonly TaskCommand[] => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t } = useI18n();
  const counts = useAppSelector((state) => selectListCounts(state, today));
  const history = useAppSelector(selectHistory);
  const modifier = isApplePlatform() ? "⌘" : "Ctrl+";
  const lastChange = history.past.at(-1);
  const nextChange = history.future.at(-1);
  const allCompleted = counts.total > 0 && counts.all === 0;

  return [
    {
      id: "undo",
      label: lastChange ? `${t("actions.undo")}: ${formatMessage(t, lastChange.description)}` : t("actions.undo"),
      icon: "undo",
      hint: `${modifier}Z`,
      disabled: !lastChange,
      run: () => dispatch(undo()),
    },
    {
      id: "redo",
      label: nextChange ? `${t("actions.redo")}: ${formatMessage(t, nextChange.description)}` : t("actions.redo"),
      icon: "redo",
      hint: `${modifier}⇧Z`,
      disabled: !nextChange,
      run: () => dispatch(redo()),
    },
    {
      id: "toggle-all",
      label: allCompleted ? t("actions.markAllActive") : t("actions.completeAll"),
      icon: allCompleted ? "rotate" : "checkAll",
      disabled: counts.total === 0,
      run: () => dispatch(allTasksMarked(!allCompleted)),
    },
    {
      id: "clear",
      label: t("actions.clearCompleted"),
      icon: "eraser",
      disabled: counts.completed === 0,
      run: () => dispatch(clearCompleted()),
    },
    {
      id: "export",
      label: t("actions.export"),
      keywords: "json backup",
      icon: "download",
      disabled: counts.total === 0,
      run: () => dispatch(exportData()),
    },
  ];
};
