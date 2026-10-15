import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectPaletteOpen } from "@/features/lists/model/selectors";
import { overlayClosed, overlayOpened } from "@/features/lists/model/viewSlice";
import ProjectIcon from "@/features/projects/ui/ProjectIcon/ProjectIcon";
import { useShortcut } from "@/shared/hooks/useShortcut";
import { LOCALE_INFO } from "@/shared/i18n/locales";
import { useI18n } from "@/shared/i18n/useI18n";
import { isModKey } from "@/shared/lib/keyboard";
import Dialog from "@/shared/ui/Dialog/Dialog";
import Flag from "@/shared/ui/Flag/Flag";
import Icon from "@/shared/ui/Icon/Icon";

import { usePaletteCommands, type PaletteCommand } from "../../model/usePaletteCommands";

import styles from "./CommandPalette.module.scss";

// The element id of a command in the list
const optionId = (listboxId: string, commandId: string) => `${listboxId}-${commandId}`;

// Search field and ranked commands: actions, tasks, lists, projects and settings
const PaletteContent = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const trimmed = query.trim();
  const { groups, search: searchCommand } = usePaletteCommands(trimmed);
  const ranked = groups.flatMap(({ items }) => items);
  const flat = searchCommand ? [...ranked, searchCommand] : ranked;
  const active = flat[Math.min(activeIndex, flat.length - 1)];
  const activeId = active ? optionId(listboxId, active.id) : undefined;

  // Keeps the highlighted command in view
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  // Closes the palette first so the command acts on the page
  const run = (command: PaletteCommand) => {
    flushSync(() => dispatch(overlayClosed("palette")));
    command.run();
  };

  // Moves the highlight and wraps around
  const move = (delta: number) => {
    if (flat.length === 0) return;
    const current = active ? flat.indexOf(active) : 0;
    setActiveIndex((current + delta + flat.length) % flat.length);
  };

  // Arrows move the highlight and Enter runs the command
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Enter" && active) {
      event.preventDefault();
      run(active);
    }
  };

  // One command as an option of the list
  const renderOption = (command: PaletteCommand) => (
    <div
      key={command.id}
      id={optionId(listboxId, command.id)}
      role="option"
      tabIndex={-1}
      aria-selected={command === active}
      aria-current={command.current ? "true" : undefined}
      className={styles.option}
      onPointerMove={() => setActiveIndex(flat.indexOf(command))}
      onClick={() => run(command)}
      onKeyDown={(event) => {
        if (event.key === "Enter") run(command);
      }}
    >
      {command.flag ? (
        <Flag country={LOCALE_INFO[command.flag].flag} className={styles.optionFlag} />
      ) : command.project ? (
        <ProjectIcon name={command.project.name} color={command.project.color} size="small" />
      ) : (
        <Icon name={command.icon} filled={command.icon === "star"} className={styles.optionIcon} />
      )}
      <span className={styles.optionLabel}>{command.label}</span>
      {command.current ? <Icon name="check" className={styles.current} /> : null}
      {command.hint ? <kbd className={styles.hint}>{command.hint}</kbd> : null}
    </div>
  );

  return (
    <div className={styles.palette}>
      <div className={styles.field}>
        <Icon name="command" className={styles.fieldIcon} />
        <input
          className={styles.input}
          role="combobox"
          aria-label={t("palette.label")}
          aria-expanded="true"
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder={t("palette.placeholder")}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
        <kbd className={styles.escape}>esc</kbd>
      </div>
      <div id={listboxId} role="listbox" aria-label={t("palette.label")} className={styles.results}>
        {ranked.length === 0 && trimmed ? (
          <p className={styles.empty}>{t("palette.empty", { query: trimmed })}</p>
        ) : null}
        {groups.map(({ group, items }) => (
          <div key={group} role="group" aria-labelledby={`${listboxId}-${group}`} className={styles.group}>
            <p id={`${listboxId}-${group}`} className={styles.groupLabel}>
              {t(`palette.${group}`)}
            </p>
            {items.map(renderOption)}
          </div>
        ))}
        {searchCommand ? (
          <div role="group" aria-labelledby={`${listboxId}-search`} className={styles.group}>
            <p id={`${listboxId}-search`} className={styles.groupLabel}>
              {t("palette.search")}
            </p>
            {renderOption(searchCommand)}
          </div>
        ) : null}
      </div>
      <div className={styles.footer} aria-hidden="true">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          {t("palette.navigate")}
        </span>
        <span>
          <kbd>↵</kbd>
          {t("palette.run")}
        </span>
        <span>
          <kbd>esc</kbd>
          {t("palette.close")}
        </span>
      </div>
      <output className="visually-hidden" aria-live="polite">
        {t("palette.results", { count: flat.length })}
      </output>
    </div>
  );
};

// The palette dialog, opened with Ctrl+K or Cmd+K
const CommandPalette = () => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const open = useAppSelector(selectPaletteOpen);

  useShortcut(
    isModKey("k"),
    (event) => {
      event.preventDefault();
      dispatch(open ? overlayClosed("palette") : overlayOpened({ kind: "palette" }));
    },
    { allowInEditable: true },
  );

  return (
    <Dialog
      open={open}
      label={t("palette.label")}
      placement="top"
      onClose={() => dispatch(overlayClosed("palette"))}
      className={styles.dialog}
    >
      <PaletteContent />
    </Dialog>
  );
};

export default CommandPalette;
