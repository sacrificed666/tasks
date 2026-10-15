import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import ActionsMenu from "@/features/commands/ui/ActionsMenu/ActionsMenu";
import type { ViewId } from "@/features/lists/model/lists";
import { selectList, selectQuery } from "@/features/lists/model/selectors";
import { useViewInfo } from "@/features/lists/model/useViewInfo";
import { queryChanged } from "@/features/lists/model/viewSlice";
import { LIST_TITLE_ID } from "@/features/lists/ui/ListHeader/ListHeader";
import OfflineBadge from "@/features/notifications/ui/OfflineBadge/OfflineBadge";
import TaskSearch from "@/features/search/ui/TaskSearch/TaskSearch";
import SettingsButton from "@/features/settings/ui/SettingsButton/SettingsButton";
import { useRefraction } from "@/shared/hooks/useRefraction";
import { useScrolledPast } from "@/shared/hooks/useScrolledPast";
import { useShortcut } from "@/shared/hooks/useShortcut";
import { useI18n } from "@/shared/i18n/useI18n";
import { isPlainKey } from "@/shared/lib/keyboard";
import Brand from "@/shared/ui/Brand/Brand";
import IconButton from "@/shared/ui/IconButton/IconButton";

import styles from "./Toolbar.module.scss";

const TITLE_OFFSET = 64;

// Top bar of the compact layout with search, settings and actions
const Toolbar = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const query = useAppSelector(selectQuery);
  const list = useAppSelector(selectList);
  const view = useViewInfo();
  const condensed = useScrolledPast(LIST_TITLE_ID, TITLE_OFFSET);
  const groupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [searchView, setSearchView] = useState<ViewId | null>(null);
  const searchVisible = searchView === list || query !== "";

  useRefraction(groupRef, { bezel: 14, scale: 30 });

  // Shows the search field and focuses it
  const openSearch = () => {
    flushSync(() => setSearchView(list));
    inputRef.current?.focus();
  };

  // Clears the search and goes back to the list
  const closeSearch = () => {
    flushSync(() => {
      dispatch(queryChanged(""));
      setSearchView(null);
    });
    toggleRef.current?.focus();
  };

  useShortcut(isPlainKey("/"), (event) => {
    event.preventDefault();
    openSearch();
  });

  return (
    <header className={styles.toolbar} data-condensed={condensed || undefined}>
      {searchVisible ? (
        <div className={styles.search}>
          <TaskSearch inputRef={inputRef} onClose={closeSearch} />
          <button type="button" className={styles.cancel} onClick={closeSearch}>
            {t("search.cancel")}
          </button>
        </div>
      ) : (
        <>
          <Brand label={t("header.home")} className={styles.brand} />
          <p className={styles.title} aria-hidden="true">
            {view.title}
          </p>
          <div ref={groupRef} className={styles.group} data-glass-light="">
            <OfflineBadge />
            <IconButton
              ref={toggleRef}
              icon="search"
              label={t("header.showSearch")}
              variant="ghost"
              onClick={openSearch}
            />
            <SettingsButton variant="ghost" />
            <ActionsMenu variant="ghost" />
          </div>
        </>
      )}
    </header>
  );
};

export default Toolbar;
