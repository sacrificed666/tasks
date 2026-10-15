import { useEffect } from "react";

import { useEffectsLevel } from "./useEffectsLevel";

// Glass panels catch a light under the pointer, once per frame
export const usePointerLight = () => {
  const level = useEffectsLevel();

  // Only with a mouse and full effects
  useEffect(() => {
    if (level !== "full" || !globalThis.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let latest: PointerEvent | null = null;

    // Moves the light of the panel under the pointer
    const update = () => {
      frame = 0;
      const event = latest;
      latest = null;
      const target = event?.target instanceof Element ? event.target.closest<HTMLElement>("[data-glass-light]") : null;
      if (!event || !target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--light-x", `${event.clientX - rect.left}px`);
      target.style.setProperty("--light-y", `${event.clientY - rect.top}px`);
    };

    // Keeps the latest position and updates once per frame
    const handlePointerMove = (event: PointerEvent) => {
      latest = event;
      if (frame === 0) frame = requestAnimationFrame(update);
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(frame);
    };
  }, [level]);
};
