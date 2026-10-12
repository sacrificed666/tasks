import { registerSW } from "virtual:pwa-register";

import { toastShown } from "@/features/notifications/model/toastSlice";
import { registerUpdateHandler } from "@/shared/lib/serviceWorker";
import { installScriptUrlPolicy } from "@/shared/lib/trustedTypes";

import type { AppStore } from "./store";

// Registers the service worker and offers updates in a toast
export const startPwa = (store: AppStore) => {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

  installScriptUrlPolicy([`${import.meta.env.BASE_URL}sw.js`]);

  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      registerUpdateHandler(() => void updateServiceWorker(true));
      store.dispatch(toastShown({ message: { key: "toast.updateReady" }, action: { type: "reload" } }));
    },
    onOfflineReady() {
      store.dispatch(toastShown({ message: { key: "toast.offlineReady" }, tone: "success" }));
    },
  });
};
