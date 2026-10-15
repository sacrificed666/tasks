import type { KeyboardEvent, RefObject } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectQuery } from "@/features/lists/model/selectors";
import { overlayOpened, queryChanged } from "@/features/lists/model/viewSlice";
import { useI18n } from "@/shared/i18n/useI18n";
import { isApplePlatform } from "@/shared/lib/keyboard";
import Icon from "@/shared/ui/Icon/Icon";
import IconButton from "@/shared/ui/IconButton/IconButton";

import styles from "./TaskSearch.module.scss";

interface TaskSearchProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onClose?: () => void;
}

// Search field; Escape clears it, then leaves it
const TaskSearch = ({ inputRef, onClose }: TaskSearchProps) => {
  const dispatch = useAppDispatch();
  const query = useAppSelector(selectQuery);
  const shortcut = isApplePlatform() ? "⌘K" : "Ctrl K";
  const { t } = useI18n();

  // Escape clears the search, a second Escape leaves the field
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (query) {
      dispatch(queryChanged(""));
      return;
    }
    inputRef.current?.blur();
    onClose?.();
  };

  // Clears the search and keeps typing in the field
  const clear = () => {
    dispatch(queryChanged(""));
    inputRef.current?.focus();
  };

  return (
    <search className={styles.field} data-glass-light="">
      <Icon name="search" className={styles.icon} />
      <input
        ref={inputRef}
        type="search"
        className={styles.input}
        value={query}
        placeholder={t("search.placeholder")}
        aria-label={t("search.label")}
        aria-keyshortcuts="/"
        autoComplete="off"
        enterKeyHint="search"
        onChange={(event) => dispatch(queryChanged(event.target.value))}
        onKeyDown={handleKeyDown}
      />
      {query ? (
        <IconButton icon="xmark" label={t("search.clear")} variant="ghost" size="small" onClick={clear} />
      ) : (
        <button
          type="button"
          className={styles.hint}
          aria-label={`${t("header.palette")} (${shortcut})`}
          aria-keyshortcuts="Meta+K Control+K"
          onClick={() => dispatch(overlayOpened({ kind: "palette" }))}
        >
          {shortcut}
        </button>
      )}
    </search>
  );
};

export default TaskSearch;
