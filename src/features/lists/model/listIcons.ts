import type { IconName } from "@/shared/ui/Icon/icons";

import type { ListId } from "./lists";

export const LIST_ICONS: Readonly<Record<ListId, IconName>> = {
  all: "inbox",
  today: "sun",
  upcoming: "calendarDays",
  important: "star",
  completed: "circleCheck",
};
