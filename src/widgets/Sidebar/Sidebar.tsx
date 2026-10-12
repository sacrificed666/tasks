import { useRef } from "react";

import ActionsMenu from "@/features/commands/ui/ActionsMenu/ActionsMenu";
import ListNav from "@/features/lists/ui/ListNav/ListNav";
import TagNav from "@/features/lists/ui/TagNav/TagNav";
import OfflineBadge from "@/features/notifications/ui/OfflineBadge/OfflineBadge";
import ProjectNav from "@/features/projects/ui/ProjectNav/ProjectNav";
import TaskSearch from "@/features/search/ui/TaskSearch/TaskSearch";
import SettingsButton from "@/features/settings/ui/SettingsButton/SettingsButton";
import Overview from "@/features/stats/ui/Overview/Overview";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import { useRefraction } from "@/shared/hooks/useRefraction";
import { useShortcut } from "@/shared/hooks/useShortcut";
import { useI18n } from "@/shared/i18n/useI18n";
import { isPlainKey } from "@/shared/lib/keyboard";
import { COMPACT_LAYOUT, WIDE_LAYOUT } from "@/shared/lib/media";
import Brand from "@/shared/ui/Brand/Brand";

import styles from "./Sidebar.module.scss";

// Brand, actions, search, lists, projects and tags
const Navigator = () => {
  const { t } = useI18n();
  const panelRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useRefraction(panelRef, { bezel: 18, scale: 36 });

  useShortcut(isPlainKey("/"), (event) => {
    event.preventDefault();
    searchRef.current?.focus();
  });

  return (
    <header ref={panelRef} className={styles.panel} data-glass-light="">
      <div className={styles.top}>
        <Brand label={t("header.home")} name={t("app.name")} />
        <div className={styles.tools}>
          <OfflineBadge />
          <SettingsButton variant="ghost" />
          <ActionsMenu variant="ghost" />
        </div>
      </div>
      <TaskSearch inputRef={searchRef} />
      <ListNav />
      <ProjectNav />
      <TagNav />
    </header>
  );
};

// The left column with the navigation
const Sidebar = () => {
  const compact = useMediaQuery(COMPACT_LAYOUT);
  const wide = useMediaQuery(WIDE_LAYOUT);

  return (
    <div className={styles.sidebar}>
      {compact ? null : <Navigator />}
      {wide ? null : <Overview />}
    </div>
  );
};

export default Sidebar;
