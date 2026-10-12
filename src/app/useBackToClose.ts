import { useEffect, useEffectEvent, useRef } from "react";

import { isRecord } from "@/shared/lib/guards";

const MARKER = "taskOverlay";

// The overlay marker of the current history entry
const currentMarker = () => {
  const state: unknown = globalThis.history.state;
  return isRecord(state) ? state[MARKER] : undefined;
};

// The back button closes an open overlay instead of leaving
export const useBackToClose = (open: boolean, onBack: () => void) => {
  const marker = useRef<string | null>(null);
  const handleBack = useEffectEvent(onBack);

  // Adds a history entry while open and removes it when closed
  useEffect(() => {
    if (open) {
      if (marker.current !== null) return;
      const id = crypto.randomUUID();
      const state: unknown = globalThis.history.state;
      globalThis.history.pushState({ ...(isRecord(state) ? state : {}), [MARKER]: id }, "");
      marker.current = id;
      return;
    }

    if (marker.current === null) return;
    const timer = window.setTimeout(() => {
      const id = marker.current;
      marker.current = null;
      if (id !== null && currentMarker() === id) globalThis.history.back();
    });
    return () => clearTimeout(timer);
  }, [open]);

  // The back button closes the overlay instead of leaving the app
  useEffect(() => {
    // Ignores history changes that keep our entry
    const handlePopState = () => {
      if (marker.current === null || currentMarker() === marker.current) return;
      marker.current = null;
      handleBack();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
};
