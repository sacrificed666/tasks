import { describe, expect, it } from "vitest";

import { selectTasks } from "@/features/tasks/model/selectors";

import { applyLaunchIntent, readLaunchIntent } from "./launch";
import { setupStore } from "./store";

describe("readLaunchIntent", () => {
  it("ignores URLs without launch parameters", () => {
    expect(readLaunchIntent("")).toBeNull();
    expect(readLaunchIntent("?utm_source=home")).toBeNull();
  });

  it("reads shortcuts", () => {
    expect(readLaunchIntent("?list=today")).toEqual({ list: "today", compose: false, draft: null });
    expect(readLaunchIntent("?action=new&list=unknown")).toEqual({ list: null, compose: true, draft: null });
  });

  it("turns shared content into a draft", () => {
    expect(readLaunchIntent("?title=Read%20later&text=Great%20article&url=https%3A%2F%2Fexample.com")).toEqual({
      list: null,
      compose: false,
      draft: { title: "Read later", notes: "Great article\nhttps://example.com" },
    });
    expect(readLaunchIntent("?url=https%3A%2F%2Fexample.com")?.draft).toEqual({
      title: "https://example.com",
      notes: "",
    });
  });
});

describe("applyLaunchIntent", () => {
  it("switches lists and opens the composer outside the completed list", () => {
    const store = setupStore();
    applyLaunchIntent(store, { list: "completed", compose: true, draft: null });
    expect(store.getState().view.list).toBe("all");

    applyLaunchIntent(store, { list: "today", compose: false, draft: null });
    expect(store.getState().view.list).toBe("today");
  });

  it("adds shared content as a task and confirms it", () => {
    const store = setupStore();
    applyLaunchIntent(store, { list: null, compose: false, draft: { title: "Read later", notes: "https://a.b" } });

    expect(selectTasks(store.getState())).toMatchObject([{ title: "Read later", notes: "https://a.b" }]);
    expect(store.getState().toast.current?.message).toEqual({ key: "toast.added", params: { title: "Read later" } });
  });
});
