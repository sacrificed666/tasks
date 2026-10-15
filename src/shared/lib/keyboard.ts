const EDITABLE_SELECTOR =
  "textarea, select, [contenteditable]:not([contenteditable='false']), input:not([type=checkbox], [type=radio], [type=button], [type=submit], [type=reset], [type=range], [type=color], [type=file])";

export type KeyMatcher = (event: KeyboardEvent) => boolean;

// Whether a key press goes to a text field
export const isEditableTarget = (target: EventTarget | null) =>
  target instanceof Element && target.matches(EDITABLE_SELECTOR);

// A matcher for a key without modifiers
export const isPlainKey =
  (key: string): KeyMatcher =>
  (event) =>
    event.key.toLowerCase() === key && !event.metaKey && !event.ctrlKey && !event.altKey;

// A matcher for Ctrl or Cmd with a key
export const isModKey =
  (key: string, { shift = false }: { shift?: boolean } = {}): KeyMatcher =>
  (event) =>
    (event.metaKey || event.ctrlKey) && !event.altKey && event.shiftKey === shift && event.key.toLowerCase() === key;

export const isUndoKey = isModKey("z");

// Ctrl or Cmd with Shift and Z, or Ctrl and Y
export const isRedoKey: KeyMatcher = (event) =>
  isModKey("z", { shift: true })(event) || (event.ctrlKey && !event.metaKey && isModKey("y")(event));

// Whether shortcuts should show Cmd instead of Ctrl
export const isApplePlatform = () => /Mac|iPhone|iPad|iPod/.test(globalThis.navigator.userAgent);
