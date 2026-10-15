import { act, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { overlayOpened } from "@/features/lists/model/viewSlice";
import { makeState, sampleTasks } from "@/test/factories";
import { renderWithStore } from "@/test/render";

import SettingsDialog from "./SettingsDialog";

// Renders the settings dialog and opens it
const openSettings = () => {
  const view = renderWithStore(<SettingsDialog />, { preloadedState: makeState(sampleTasks) });
  act(() => {
    view.store.dispatch(overlayOpened({ kind: "settings" }));
  });
  return view;
};

// A group of choices by its name
const group = (name: string) => within(screen.getByRole("group", { name }));

describe("SettingsDialog", () => {
  it("changes the appearance, accent, background and glass", async () => {
    const { store, user } = openSettings();
    await user.click(group("Appearance").getByRole("radio", { name: "Dark" }));
    await user.click(group("Accent colour").getByRole("radio", { name: "Sunset" }));
    await user.click(group("Background").getByRole("radio", { name: "Ocean" }));
    await user.click(group("Glass").getByRole("radio", { name: "Tinted" }));
    expect(store.getState().settings).toMatchObject({
      appearance: "dark",
      accent: "sunset",
      backdrop: "ocean",
      glass: "tinted",
    });
    expect(screen.getByRole("group", { name: "Glass" })).toHaveAccessibleDescription(
      "Tinted glass is easier to read on bright backgrounds.",
    );
  });

  it("explains what Auto effects mean on this device", async () => {
    const { store, user } = openSettings();
    const effects = screen.getByRole("group", { name: "Effects" });
    expect(effects).toHaveAccessibleDescription("On this device: Reduced");
    await user.click(within(effects).getByRole("radio", { name: "Full" }));
    expect(store.getState().settings.effects).toBe("full");
    expect(effects).not.toHaveAccessibleDescription();
  });

  it("switches the language and closes", async () => {
    const { store, user } = openSettings();
    await user.click(group("Language").getByRole("radio", { name: "Українська" }));
    await waitFor(() => {
      expect(store.getState().settings.locale).toBe("uk");
    });
    await user.click(screen.getByRole("button", { name: "Закрити" }));
    expect(store.getState().view.overlay).toBeNull();
  });
});
