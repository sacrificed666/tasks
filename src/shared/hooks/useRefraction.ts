import { useLayoutEffect, type RefObject } from "react";

import { attachRefraction, isRefractionSupported, type RefractionOptions } from "../lib/refraction";
import { useEffectsLevel } from "./useEffectsLevel";

// Bends the backdrop at the edges of a glass panel in full effects
export const useRefraction = (ref: RefObject<HTMLElement | null>, { bezel, scale }: RefractionOptions = {}) => {
  const level = useEffectsLevel();

  // Attaches the filter before paint and removes it on cleanup
  useLayoutEffect(() => {
    const element = ref.current;
    if (level !== "full" || !element || !isRefractionSupported()) return;
    return attachRefraction(element, { bezel, scale });
  }, [ref, bezel, scale, level]);
};
