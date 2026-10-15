import { useSyncExternalStore } from "react";

// Whether a media query matches, updated when it changes
export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const media = globalThis.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => globalThis.matchMedia(query).matches,
  );
