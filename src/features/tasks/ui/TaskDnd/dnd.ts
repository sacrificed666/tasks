import {
  closestCenter,
  pointerWithin,
  type Active,
  type Announcements,
  type CollisionDetection,
  type Over,
} from "@dnd-kit/core";
import { hasSortableData } from "@dnd-kit/sortable";

import { isViewId, type ViewId } from "@/features/lists/model/lists";
import type { Translate } from "@/shared/i18n/translate";

export const DROP_PREFIX = "drop:";

interface Entry {
  id: string | number;
  data: { current?: Record<string, unknown> };
}

export type DropResult =
  | { type: "target"; id: string; target: ViewId }
  | { type: "reorder"; activeId: string; overId: string }
  | null;

// Whether a droppable is a list or project rather than a task
export const isDropTarget = (entry: Pick<Entry, "id"> | null) =>
  typeof entry?.id === "string" && entry.id.startsWith(DROP_PREFIX);

// A task or target as spoken text
const describe = (t: Translate, entry: Entry | null) => {
  const title = entry?.data.current?.title;
  if (typeof title === "string") return t("dnd.task", { title });
  const label = entry?.data.current?.label;
  return typeof label === "string" ? label : t("dnd.fallback");
};

// What screen readers hear while a task is dragged
export const createAnnouncements = (t: Translate): Announcements => ({
  onDragStart: ({ active }) => t("dnd.pickedUp", { task: describe(t, active) }),
  onDragOver: ({ active, over }) => {
    if (!over) return t("dnd.outside", { task: describe(t, active) });
    const key = isDropTarget(over) ? "dnd.overTarget" : "dnd.over";
    return t(key, { task: describe(t, active), target: describe(t, over) });
  },
  onDragEnd: ({ active, over }) => {
    if (!over) return t("dnd.droppedAlone", { task: describe(t, active) });
    const key = isDropTarget(over) ? "dnd.droppedOn" : "dnd.dropped";
    return t(key, { task: describe(t, active), target: describe(t, over) });
  },
  onDragCancel: ({ active }) => t("dnd.cancelled", { task: describe(t, active) }),
});

// Lists and projects under the pointer win over the nearest task
export const collisions: CollisionDetection = (args) => {
  const targets = pointerWithin({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) => isDropTarget(container)),
  });
  if (targets.length > 0) return targets;
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((container) => !isDropTarget(container)),
  });
};

// A drop as a move to a list or project, a reorder or nothing
export const resolveDrop = (dragged: Active, over: Over | null): DropResult => {
  if (!over) return null;
  const target: unknown = over.data.current?.target;
  if (isDropTarget(over)) return isViewId(target) ? { type: "target", id: String(dragged.id), target } : null;
  if (!hasSortableData(dragged) || !hasSortableData(over) || dragged.id === over.id) return null;
  if (dragged.data.current.sortable.containerId !== over.data.current.sortable.containerId) return null;
  return { type: "reorder", activeId: String(dragged.id), overId: String(over.id) };
};
