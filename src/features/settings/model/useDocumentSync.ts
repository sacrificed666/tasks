import { useEffect } from "react";

import { useAppSelector } from "@/app/hooks";

import { selectSettings } from "./selectors";
import { applySettings } from "./settings";

// Keeps the document in step with the settings and the system theme
export const useDocumentSync = () => {
  const settings = useAppSelector(selectSettings);

  // Applies the settings again when the system theme changes
  useEffect(() => {
    applySettings(settings);
    const media = globalThis.matchMedia("(prefers-color-scheme: light)");
    // Repaints with the new system theme
    const handleChange = () => applySettings(settings);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [settings]);
};
