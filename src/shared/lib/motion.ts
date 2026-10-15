const SETTLE_TIMEOUT = 1200;

// Whether the visitor asked for less motion
export const prefersReducedMotion = () => globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Waits until the animations inside an element end, at most a moment
export const waitForTransitions = async (element: Element | null) => {
  if (!element) return;
  const animations = element.getAnimations({ subtree: true }).map((animation) => animation.finished);
  if (animations.length === 0) return;
  await Promise.race([
    Promise.allSettled(animations),
    new Promise((resolve) => {
      setTimeout(resolve, SETTLE_TIMEOUT);
    }),
  ]);
};
