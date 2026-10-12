import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";
import { vi } from "vitest";

import App from "@/app/App";
import LocaleBridge from "@/app/LocaleBridge";
import { setupStore, type AppStore, type RootState } from "@/app/store";
import type { ViewId } from "@/features/lists/model/lists";
import type { Project } from "@/features/projects/model/project";
import type { Task } from "@/features/tasks/model/task";

import { makeState, sampleTasks } from "./factories";

interface RenderWithStoreOptions {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
}

export type User = ReturnType<typeof userEvent.setup>;

// Renders inside a store and returns it with a user
export const renderWithStore = (
  ui: ReactElement,
  { preloadedState, store = setupStore(preloadedState) }: RenderWithStoreOptions = {},
) => {
  // The store and the language around the element
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <LocaleBridge>{children}</LocaleBridge>
    </Provider>
  );
  return { store, user: userEvent.setup(), ...render(ui, { wrapper: Wrapper }) };
};

// Renders the whole app with tasks and a list
export const renderApp = (
  tasks: readonly Task[] = sampleTasks,
  list: ViewId = "all",
  projects: readonly Project[] = [],
) => renderWithStore(<App />, { preloadedState: makeState(tasks, list, "", projects) });

// Clicks a trigger and returns its popover
export const openPopover = async (user: User, trigger: HTMLElement) => {
  await user.click(trigger);
  const popover = document.getElementById(trigger.getAttribute("popovertarget") ?? "");
  if (!popover) throw new Error("Popover not found");
  return within(popover);
};

// A region by its name
export const section = (name: RegExp) => screen.getByRole("region", { name });

// Task titles of a region, read from their checkboxes
export const itemTitles = (region: HTMLElement) =>
  within(region)
    .queryAllByRole("checkbox")
    .map((checkbox) => checkbox.getAttribute("aria-label"));

// Makes the given media queries match, and reduced motion unless motion is allowed
export const mockMediaQueries = (matching: readonly string[], { motion = false } = {}) =>
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        matches: matching.includes(query) || (!motion && query.includes("prefers-reduced-motion")),
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => false,
      }) satisfies MediaQueryList,
  );
