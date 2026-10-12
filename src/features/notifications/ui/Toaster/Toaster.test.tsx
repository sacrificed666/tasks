import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { toggleId } from "@/features/tasks/ui/ids";
import * as serviceWorker from "@/shared/lib/serviceWorker";
import { makeState, makeTask } from "@/test/factories";
import { renderWithStore } from "@/test/render";

import { toastShown } from "../../model/toastSlice";
import Toaster, { TOAST_DURATION } from "./Toaster";

// Renders the toaster next to a task row and shows a toast
const showToast = (options: Parameters<typeof toastShown>[0]) => {
  const view = renderWithStore(
    <>
      <button type="button" id={toggleId("a")}>
        Row of the task
      </button>
      <Toaster />
    </>,
    { preloadedState: makeState([makeTask({ id: "a", title: "Call mum", dueDate: null })]) },
  );
  act(() => {
    view.store.dispatch(toastShown(options));
  });
  return view;
};

// Lets the clock run on
const wait = (milliseconds: number) =>
  act(() => {
    vi.advanceTimersByTime(milliseconds);
  });

afterEach(() => {
  vi.useRealTimers();
});

describe("Toaster", () => {
  it("announces the message and closes it after a while", () => {
    vi.useFakeTimers();
    const { store } = showToast({ message: { key: "toast.offlineReady" }, tone: "success" });
    expect(screen.getByRole("status", { name: "Notification" })).toHaveTextContent("Ready to work offline");
    wait(TOAST_DURATION);
    expect(store.getState().toast.current).toBeNull();
  });

  it("waits while the pointer rests on the toast", () => {
    vi.useFakeTimers();
    const { store } = showToast({ message: { key: "toast.offlineReady" } });
    const card = screen.getByText("Ready to work offline", { selector: "p" }).closest("[data-tone]");
    if (!card) throw new Error("The toast has no card");
    fireEvent.pointerEnter(card);
    wait(TOAST_DURATION * 2);
    expect(store.getState().toast.current).not.toBeNull();
    fireEvent.pointerLeave(card);
    wait(TOAST_DURATION);
    expect(store.getState().toast.current).toBeNull();
  });

  it("keeps an update offer until it is used, then applies the update", () => {
    vi.useFakeTimers();
    const applyUpdate = vi.spyOn(serviceWorker, "applyUpdate").mockImplementation(() => {});
    showToast({ message: { key: "toast.updateReady" }, action: { type: "reload" } });
    wait(TOAST_DURATION * 2);
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));
    expect(applyUpdate).toHaveBeenCalledOnce();
  });

  it("keeps a backup offer until it is used, then downloads the tasks", () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:tasks");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn<(url: string) => void>() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    showToast({ message: { key: "toast.saveFailed" }, tone: "error", action: { type: "export" } });
    wait(TOAST_DURATION * 2);
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });

  it("shows the task a toast is about and closes on request", async () => {
    const { store, user } = showToast({
      message: { key: "toast.offlineReady" },
      action: { type: "show", list: "today", taskId: "a" },
    });
    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(store.getState().view.list).toBe("today");
    expect(store.getState().toast.current).toBeNull();
    expect(screen.getByRole("button", { name: "Row of the task" })).toHaveFocus();

    act(() => {
      store.dispatch(toastShown({ message: { key: "toast.offlineReady" }, tone: "error" }));
    });
    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(store.getState().toast.current).toBeNull();
  });
});
