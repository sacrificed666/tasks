import { reloadPage } from "./navigation";

let applyPendingUpdate: (() => void) | null = null;

// Remembers how to apply a waiting update
export const registerUpdateHandler = (handler: () => void) => {
  applyPendingUpdate = handler;
};

// Applies a waiting update, or reloads the page
export const applyUpdate = () => {
  if (applyPendingUpdate) applyPendingUpdate();
  else reloadPage();
};
