import { isListId, type ListId } from "@/features/lists/model/lists";
import { listChanged } from "@/features/lists/model/viewSlice";
import { toastShown } from "@/features/notifications/model/toastSlice";
import { normalizeTitle, type TaskDraft } from "@/features/tasks/model/task";
import { addTask } from "@/features/tasks/model/thunks";

import type { AppStore } from "./store";

export interface LaunchIntent {
  list: ListId | null;
  compose: boolean;
  draft: TaskDraft | null;
}

const LAUNCH_PARAMS = ["list", "action", "title", "text", "url"] as const;

// A list, a new task or shared text from the start address
export const readLaunchIntent = (search: string): LaunchIntent | null => {
  const params = new URLSearchParams(search);
  if (!LAUNCH_PARAMS.some((name) => params.has(name))) return null;

  // A trimmed parameter of the address, or an empty string
  const read = (name: string) => params.get(name)?.trim() ?? "";
  const title = read("title");
  const text = read("text");
  const url = read("url");
  const heading = title || text || url;
  const notes = [title ? text : "", url === heading ? "" : url].filter(Boolean).join("\n");
  const list = params.get("list");

  return {
    list: isListId(list) ? list : null,
    compose: params.get("action") === "new",
    draft: heading ? { title: heading, notes } : null,
  };
};

// Opens the list or adds the shared task the app was started with
export const applyLaunchIntent = (store: AppStore, intent: LaunchIntent) => {
  if (intent.list) store.dispatch(listChanged(intent.list));
  if (intent.compose && store.getState().view.list === "completed") store.dispatch(listChanged("all"));

  if (intent.draft && store.dispatch(addTask(intent.draft))) {
    store.dispatch(
      toastShown({
        message: { key: "toast.added", params: { title: normalizeTitle(intent.draft.title) } },
        tone: "success",
      }),
    );
  }
};
