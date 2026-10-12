// A short vibration on touch devices that support it
export const tap = (duration = 10) => {
  if (!("vibrate" in navigator) || !globalThis.matchMedia("(pointer: coarse)").matches) return;
  navigator.vibrate(duration);
};
