import { useDroppable } from "@dnd-kit/core";

import type { ViewId } from "@/features/lists/model/lists";

import { DROP_PREFIX } from "./dnd";

// Makes an element a drop target and says when a task is over it
export const useDropTarget = (target: ViewId, label: string) => {
  const { setNodeRef, isOver, active } = useDroppable({ id: `${DROP_PREFIX}${target}`, data: { target, label } });
  return [setNodeRef, isOver && active !== null] as const;
};
