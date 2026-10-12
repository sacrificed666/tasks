import { useSyncExternalStore } from "react";

import { getEffectsLevel, subscribeToEffects } from "../lib/effects";

// The effects level in use, full or reduced
export const useEffectsLevel = () => useSyncExternalStore(subscribeToEffects, getEffectsLevel, getEffectsLevel);
