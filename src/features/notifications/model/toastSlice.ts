import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

import type { ViewId } from "@/features/lists/model/lists";
import type { RemovedTask } from "@/features/tasks/model/tasksSlice";
import type { MessageKey } from "@/shared/i18n/translate";

export interface ToastMessage {
  key: MessageKey;
  params?: Readonly<Record<string, string | number | ToastMessage>>;
}

export type ToastTone = "neutral" | "success" | "error";

export type ToastAction =
  | { type: "restore"; tasks: RemovedTask[] }
  | { type: "reload" }
  | { type: "export" }
  | { type: "undo" }
  | { type: "show"; list: ViewId; taskId: string };

export interface Toast {
  id: string;
  message: ToastMessage;
  tone: ToastTone;
  action: ToastAction | null;
}

interface ToastState {
  current: Toast | null;
}

interface ToastOptions {
  message: ToastMessage;
  tone?: ToastTone;
  action?: ToastAction | null;
}

const initialState: ToastState = {
  current: null,
};

// The one toast on screen, replaced by the next
export const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    toastShown: {
      reducer(state, action: PayloadAction<Toast>) {
        state.current = action.payload;
      },
      prepare: ({ message, tone = "neutral", action = null }: ToastOptions) => ({
        payload: { id: nanoid(), message, tone, action },
      }),
    },
    toastDismissed(state, action: PayloadAction<string>) {
      if (state.current?.id === action.payload) state.current = null;
    },
  },
});

export const { toastShown, toastDismissed } = toastSlice.actions;
