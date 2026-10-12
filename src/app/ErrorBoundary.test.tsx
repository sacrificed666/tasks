import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import * as download from "@/shared/lib/download";
import * as navigation from "@/shared/lib/navigation";

import ErrorBoundary from "./ErrorBoundary";
import { STORAGE_KEYS } from "./persistence";

// A component that always fails to render
const Broken = (): never => {
  throw new Error("Boom");
};

// Renders the broken component inside the boundary
const renderBroken = () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const user = userEvent.setup();
  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  );
  return user;
};

describe("ErrorBoundary", () => {
  it("renders children while nothing fails", () => {
    render(
      <ErrorBoundary>
        <p>Healthy</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("shows a recovery screen with the error details", () => {
    document.documentElement.lang = "en";
    renderBroken();

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByText("Boom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload the app" })).toBeInTheDocument();
  });

  it("speaks the language of the app", () => {
    document.documentElement.lang = "uk";
    renderBroken();
    expect(screen.getByRole("heading", { name: "Щось пішло не так" })).toBeInTheDocument();
    document.documentElement.lang = "en";
  });

  it("downloads a backup of the stored tasks", async () => {
    const downloadJson = vi.spyOn(download, "downloadJson").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify({ tasks: [], projects: [] }));
    const user = renderBroken();

    await user.click(screen.getByRole("button", { name: "Download a backup" }));

    expect(downloadJson).toHaveBeenCalledWith(expect.stringMatching(/^tasks-/), { tasks: [], projects: [] });
  });

  it("resets the view settings and reloads", async () => {
    const reload = vi.spyOn(navigation, "reloadPage").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify({ list: "today" }));
    const user = renderBroken();

    await user.click(screen.getByRole("button", { name: "Reset view settings" }));

    expect(localStorage.getItem(STORAGE_KEYS.preferences)).toBeNull();
    expect(reload).toHaveBeenCalledOnce();
  });
});
