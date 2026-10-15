import { useSyncExternalStore } from "react";

import { toDateKey } from "../lib/date";

const REFRESH_INTERVAL = 60_000;
const listeners = new Set<() => void>();
let timer = 0;

// Tells every subscriber to check the date again
const notify = () => {
  for (const listener of listeners) listener();
};

// One timer for all subscribers, checking the date every minute
const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  if (listeners.size === 1) timer = window.setInterval(notify, REFRESH_INTERVAL);
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.clearInterval(timer);
  };
};

// Today as a date key
const getSnapshot = () => toDateKey(new Date());

// Today's date, which changes at midnight while the app is open
export const useToday = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
