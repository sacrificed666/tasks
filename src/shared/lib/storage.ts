// Local storage, or null when the browser blocks it
export const getStorage = (): Storage | null => {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

// Parsed JSON under a key, or undefined
export const readJson = (storage: Storage, key: string): unknown => {
  try {
    const raw = storage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
};

// Writes text unless it is unchanged; false when storage is full
export const writeText = (storage: Storage, key: string, value: string) => {
  try {
    if (storage.getItem(key) !== value) storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

// Removes a key, ignoring blocked storage
export const removeKey = (storage: Storage, key: string) => {
  try {
    storage.removeItem(key);
  } catch {
    return;
  }
};

// Asks the browser to spare the data when it clears storage; true if it will
export const requestPersistence = async (): Promise<boolean> => {
  if (!("storage" in navigator) || !("persist" in navigator.storage)) return false;
  try {
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
};
