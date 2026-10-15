import { useAppDispatch, useAppSelector } from "@/app/hooks";
import CommandPalette from "@/features/commands/ui/CommandPalette/CommandPalette";
import { redo, undo } from "@/features/data/model/thunks";
import { selectDetailsId, selectOverlay } from "@/features/lists/model/selectors";
import { useListShortcuts } from "@/features/lists/model/useListShortcuts";
import { useSwipeNavigation } from "@/features/lists/model/useSwipeNavigation";
import { detailsClosed, overlayClosed } from "@/features/lists/model/viewSlice";
import ListsSheet from "@/features/lists/ui/ListsSheet/ListsSheet";
import TabBar from "@/features/lists/ui/TabBar/TabBar";
import Toaster from "@/features/notifications/ui/Toaster/Toaster";
import ProjectDialog from "@/features/projects/ui/ProjectDialog/ProjectDialog";
import { useDocumentSync } from "@/features/settings/model/useDocumentSync";
import SettingsDialog from "@/features/settings/ui/SettingsDialog/SettingsDialog";
import { selectListCounts } from "@/features/tasks/model/selectors";
import TaskDetailsDialog from "@/features/tasks/ui/TaskDetailsDialog/TaskDetailsDialog";
import TaskDnd from "@/features/tasks/ui/TaskDnd/TaskDnd";
import { useAppBadge } from "@/shared/hooks/useAppBadge";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { usePointerLight } from "@/shared/hooks/usePointerLight";
import { useShortcut } from "@/shared/hooks/useShortcut";
import { useToday } from "@/shared/hooks/useToday";
import { useI18n } from "@/shared/i18n/useI18n";
import { isRedoKey, isUndoKey } from "@/shared/lib/keyboard";
import { COMPACT_LAYOUT, WIDE_LAYOUT } from "@/shared/lib/media";
import Backdrop from "@/widgets/Backdrop/Backdrop";
import Footer from "@/widgets/Footer/Footer";
import Inspector from "@/widgets/Inspector/Inspector";
import Sidebar from "@/widgets/Sidebar/Sidebar";
import Toolbar from "@/widgets/Toolbar/Toolbar";
import Workspace, { WORKSPACE_ID } from "@/widgets/Workspace/Workspace";

import { useBackToClose } from "./useBackToClose";
import { useDocumentTitle } from "./useDocumentTitle";

import styles from "./App.module.scss";

// The app: layout, overlays and the global shortcuts
const App = () => {
  const dispatch = useAppDispatch();
  const today = useToday();
  const { t } = useI18n();
  const compact = useMediaQuery(COMPACT_LAYOUT);
  const wide = useMediaQuery(WIDE_LAYOUT);
  const counts = useAppSelector((state) => selectListCounts(state, today));
  const overlay = useAppSelector(selectOverlay);
  const detailsOpen = useAppSelector((state) => selectDetailsId(state) !== null) && !wide;

  usePointerLight();
  useDocumentSync();
  useListShortcuts();
  useSwipeNavigation(compact, WORKSPACE_ID);
  useAppBadge(counts.today);
  useDocumentTitle();

  useBackToClose(overlay !== null || detailsOpen, () => {
    if (overlay) dispatch(overlayClosed(overlay.kind));
    else dispatch(detailsClosed());
  });

  useShortcut(isUndoKey, (event) => {
    event.preventDefault();
    dispatch(undo());
  });

  useShortcut(isRedoKey, (event) => {
    event.preventDefault();
    dispatch(redo());
  });

  return (
    <div className={styles.app}>
      <a className={styles.skip} href={`#${WORKSPACE_ID}`}>
        {t("app.skip")}
      </a>
      <Backdrop />
      <div className={styles.titlebar} aria-hidden="true" />
      <TaskDnd>
        <div className={styles.body}>
          {compact ? <Toolbar /> : null}
          <Sidebar />
          <Workspace />
          {wide ? <Inspector /> : null}
        </div>
        {compact ? <ListsSheet /> : null}
      </TaskDnd>
      <Footer />
      {compact ? <TabBar /> : null}
      {wide ? null : <TaskDetailsDialog />}
      <CommandPalette />
      <SettingsDialog />
      <ProjectDialog />
      <Toaster />
    </div>
  );
};

export default App;
