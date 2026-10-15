import { useId, useRef, type CSSProperties } from "react";

// Ids and trigger props that tie a button to its popover
export const usePopover = () => {
  const id = `popover${useId().replaceAll(/[^\w-]/g, "")}`;
  const ref = useRef<HTMLDialogElement>(null);
  const anchorName = `--${id}`;

  const triggerProps = { popoverTarget: id, style: { anchorName } satisfies CSSProperties };
  // Hides the popover
  const close = () => ref.current?.hidePopover();

  return { id, ref, anchorName, triggerProps, close };
};
