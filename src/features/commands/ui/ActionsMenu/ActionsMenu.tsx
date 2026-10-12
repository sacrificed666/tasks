import { useRef, type ChangeEvent, type ReactNode } from "react";

import { useAppDispatch } from "@/app/hooks";
import { importData } from "@/features/data/model/thunks";
import { MAX_IMPORT_BYTES } from "@/features/data/model/transfer";
import { toastShown } from "@/features/notifications/model/toastSlice";
import { useI18n } from "@/shared/i18n/useI18n";
import { isApplePlatform } from "@/shared/lib/keyboard";
import Icon from "@/shared/ui/Icon/Icon";
import type { IconName } from "@/shared/ui/Icon/icons";
import IconButton, { type IconButtonVariant } from "@/shared/ui/IconButton/IconButton";
import Popover from "@/shared/ui/Popover/Popover";
import { usePopover } from "@/shared/ui/Popover/usePopover";

import { useTaskCommands, type TaskCommandId } from "../../model/useTaskCommands";

import styles from "./ActionsMenu.module.scss";

const GROUPS: readonly (readonly TaskCommandId[])[] = [["undo", "redo"], ["toggle-all", "clear"], ["export"]];

interface MenuItemProps {
  icon: IconName;
  disabled?: boolean;
  hint?: string;
  onSelect: () => void;
  children: ReactNode;
}

// One menu action with an icon and an optional shortcut hint
const MenuItem = ({ icon, disabled = false, hint, onSelect, children }: MenuItemProps) => (
  <button type="button" className={styles.item} disabled={disabled} onClick={onSelect}>
    <Icon name={icon} className={styles.icon} />
    <span className={styles.label}>{children}</span>
    {hint ? <span className={styles.hint}>{hint}</span> : null}
  </button>
);

interface ActionsMenuProps {
  variant?: IconButtonVariant;
}

// Menu with the task commands, undo and redo
const ActionsMenu = ({ variant = "glass" }: ActionsMenuProps) => {
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const commands = useTaskCommands();
  const popover = usePopover();
  const fileRef = useRef<HTMLInputElement>(null);
  const apple = isApplePlatform();

  const shortcuts = [
    { keys: ["N"], label: t("shortcuts.newTask") },
    { keys: ["/"], label: t("shortcuts.search") },
    { keys: [apple ? "⌘" : "Ctrl", "K"], label: t("shortcuts.palette") },
    { keys: ["1-5"], label: t("shortcuts.lists") },
    { keys: ["↑", "↓"], label: t("shortcuts.navigate") },
    { keys: [apple ? "⌥" : "Alt", "↑", "↓"], label: t("shortcuts.reorder") },
    { keys: ["S", "D", "E", "I"], label: t("shortcuts.taskActions") },
    { keys: ["⇧", "F10"], label: t("shortcuts.menu") },
  ];

  // Closes the menu, then runs the action
  const select = (run: () => void) => {
    popover.close();
    run();
  };

  // Imports the picked file and lets the same file be picked again
  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      dispatch(toastShown({ message: { key: "toast.importTooLarge" }, tone: "error" }));
      return;
    }
    dispatch(importData(await file.text()));
  };

  return (
    <>
      <IconButton icon="ellipsis" label={t("actions.open")} variant={variant} {...popover.triggerProps} />
      <Popover
        id={popover.id}
        popoverRef={popover.ref}
        anchorName={popover.anchorName}
        label={t("actions.open")}
        className={styles.panel}
      >
        {GROUPS.map((group, index) => (
          <div key={group.join()} className={styles.group}>
            {commands
              .filter((command) => group.includes(command.id))
              .map((command) => (
                <MenuItem
                  key={command.id}
                  icon={command.icon}
                  disabled={command.disabled}
                  hint={command.hint}
                  onSelect={() => select(command.run)}
                >
                  {command.label}
                </MenuItem>
              ))}
            {index === GROUPS.length - 1 ? (
              <MenuItem icon="upload" onSelect={() => select(() => fileRef.current?.click())}>
                {t("actions.import")}
              </MenuItem>
            ) : null}
          </div>
        ))}
        <dl className={styles.shortcuts}>
          {shortcuts.map(({ keys, label }) => (
            <div key={label}>
              <dt>
                {keys.map((key) => (
                  <kbd key={key}>{key}</kbd>
                ))}
              </dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      </Popover>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        aria-label={t("actions.importLabel")}
        onChange={(event) => void handleImport(event)}
      />
    </>
  );
};

export default ActionsMenu;
