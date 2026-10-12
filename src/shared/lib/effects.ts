export type EffectsLevel = "full" | "reduced";

const listeners = new Set<() => void>();
let current: EffectsLevel = "reduced";

// The effects level in use
export const getEffectsLevel = () => current;

// Changes the effects level and tells every subscriber
export const setEffectsLevel = (level: EffectsLevel) => {
  if (level === current) return;
  current = level;
  for (const listener of listeners) listener();
};

// Registers a listener for effects changes
export const subscribeToEffects = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const RICH_EFFECTS_DEVICES = /Mac|iPhone|iPad|iPod/u;

// Full effects only on Apple devices, whose GPUs keep the glass smooth
export const prefersRichEffects = (userAgent = globalThis.navigator.userAgent) => RICH_EFFECTS_DEVICES.test(userAgent);
