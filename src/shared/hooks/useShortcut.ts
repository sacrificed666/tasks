import { useEffect, useEffectEvent } from "react";

import { isEditableTarget, type KeyMatcher } from "../lib/keyboard";

interface ShortcutOptions {
  allowInEditable?: boolean;
}

// A document keyboard shortcut that leaves text fields alone
export const useShortcut = (
  matches: KeyMatcher,
  handler: (event: KeyboardEvent) => void,
  { allowInEditable = false }: ShortcutOptions = {},
) => {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.isComposing || event.repeat) return;
    if (!allowInEditable && isEditableTarget(event.target)) return;
    if (matches(event)) handler(event);
  });

  // One document listener that always calls the latest handler
  useEffect(() => {
    // Hands every key to the latest handler
    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);
};
