import { useEffect, useEffectEvent, type RefObject } from "react";

import { isEditableTarget } from "@/shared/lib/keyboard";

export interface RowShortcuts {
  // Opens the context menu of the row
  menu: () => void;
  // Moves the focus to the next or previous row
  focus: (direction: 1 | -1) => void;
  // Moves the row itself down or up
  move: (direction: 1 | -1) => void;
  // Actions on a single key, by its lower-case name
  keys: Readonly<Record<string, (() => void) | undefined>>;
}

// Arrows, the menu key and single-key actions while the focus is in the row
export const useRowShortcuts = (
  itemRef: RefObject<HTMLLIElement | null>,
  disabled: boolean,
  shortcuts: RowShortcuts,
) => {
  // Handles one key press with the latest state of the row
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const { target } = event;
    if (disabled || event.defaultPrevented || event.metaKey || event.ctrlKey) return;
    if (!(target instanceof Element) || isEditableTarget(target) || target.closest("[popover]")) return;

    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
      event.preventDefault();
      shortcuts.menu();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? -1 : 1;
      if (event.altKey) shortcuts.move(direction);
      else shortcuts.focus(direction);
      return;
    }

    if (event.altKey || event.shiftKey) return;
    const action = shortcuts.keys[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    action();
  });

  // Listens for the shortcuts on the row
  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;
    // Hands every key to the latest handler
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    item.addEventListener("keydown", listener);
    return () => item.removeEventListener("keydown", listener);
  }, [itemRef]);
};
