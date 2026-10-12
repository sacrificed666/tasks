import { useAppDispatch } from "@/app/hooks";
import { useShortcut } from "@/shared/hooks/useShortcut";

import { LISTS } from "./lists";
import { listChanged } from "./viewSlice";

// Digits 1 to 5 without modifiers
const isListShortcut = (event: KeyboardEvent) =>
  /^[1-5]$/.test(event.key) && !event.metaKey && !event.ctrlKey && !event.altKey;

// Digits 1 to 5 open the smart lists
export const useListShortcuts = () => {
  const dispatch = useAppDispatch();

  useShortcut(isListShortcut, (event) => {
    const next = LISTS[Number(event.key) - 1];
    if (!next) return;
    event.preventDefault();
    dispatch(listChanged(next));
  });
};
