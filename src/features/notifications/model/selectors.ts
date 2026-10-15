import type { RootState } from "@/app/store";

// The toast on screen
export const selectToast = (state: RootState) => state.toast.current;
